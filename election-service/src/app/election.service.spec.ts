import { ElectionService } from './election.service';

/**
 * Crea un mock "chainable" estilo Supabase query builder.
 * Soporta: select, eq, order, update, insert, delete, single, maybeSingle
 * y devuelve { data, error } al final cuando corresponde.
 */
function makeSupabaseMock() {
  // estado del "query" actual
  const state: any = {
    // valores que puedes cambiar por test
    openElectionsData: [],
    electionData: { id: 'target', status: 'DRAFT' },
    candidatesData: [],
    updateResultData: { id: 'target', status: 'OPEN' },
    closeResultData: { id: 'e1', status: 'CLOSED' },
  };

  // builder base
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    update: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    delete: jest.fn(() => builder),

    // "terminal" calls
    single: jest.fn(async () => ({ data: null, error: null })),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
  };

  // from() decide qué devolver según "tabla" y según el flujo del servicio
  const supabase = {
    from: jest.fn((table: string) => {
      // IMPORTANTE: aquí resolvemos qué responderá single()
      // dependiendo del "table" típico (ajusta si tu tabla se llama distinto).
      // En tu service se ve:
      // - getElection: from('elections').select('*').eq('id', id).single()
      // - candidates: from('candidates').select('*').eq('election_id', id).order(...)
      // - openElection rule: busca otras OPEN (probablemente from('elections').select...eq('status','OPEN'))
      //
      // Para no depender de nombres exactos, lo controlamos con state y con la secuencia de llamadas.

      // reset terminal behavior por cada from()
      builder.single.mockImplementation(async () => {
        // Si el servicio pide single(), por diseño es una elección (getElection o update/close)
        // Decidimos por el último update aplicado:
        // - si update fue llamado con status CLOSED => closeResultData
        // - si update fue llamado con status OPEN => updateResultData
        const lastUpdateArgs = builder.update.mock.calls.at(-1)?.[0];
        if (lastUpdateArgs?.status === 'CLOSED') {
          return { data: state.closeResultData, error: null };
        }
        if (lastUpdateArgs?.status === 'OPEN') {
          return { data: state.updateResultData, error: null };
        }
        // default: getElection()
        return { data: state.electionData, error: null };
      });

      // para consultas que NO terminan en single() (como candidates con order),
      // supabase-js usualmente devuelve { data, error } con await directamente,
      // pero en tu código se ve que no hay await al final del chain en el snippet del error:
      // .order(...)  -> por eso tu service probablemente hace `const { data, error } = await ...order(...)`
      // entonces necesitamos que builder sea "thenable".
      //
      // Hacemos builder compatible con await: await builder => {data,error}
      builder.then = (resolve: any) => {
        // detectar si el flujo es "candidates"
        // Si se llamó order(), retornamos candidatesData
        if (builder.order.mock.calls.length > 0) {
          return resolve({ data: state.candidatesData, error: null });
        }
        // detectar si se buscó OPEN elections (por eq('status','OPEN') o similar)
        if (builder.eq.mock.calls.some((c: any[]) => c?.[0] === 'status' && c?.[1] === 'OPEN')) {
          return resolve({ data: state.openElectionsData, error: null });
        }
        // default
        return resolve({ data: [], error: null });
      };

      return builder;
    }),
  };

  return { supabase, builder, state };
}

describe('ElectionService (unit)', () => {
  it('should enforce single OPEN election rule', async () => {
    const svc = new ElectionService() as any;
    const { supabase, state } = makeSupabaseMock();

    // Simular que ya existe otra elección OPEN
    state.openElectionsData = [{ id: 'other-open' }];

    svc.supabase = supabase;

    await expect(svc.openElection('target')).rejects.toThrow('There is already an OPEN election');
  });

  it('should open election when no other OPEN election exists', async () => {
    const svc = new ElectionService() as any;
    const { supabase, state } = makeSupabaseMock();

    state.openElectionsData = []; // no hay OPEN
    state.electionData = { id: 'target', status: 'DRAFT' };
    state.candidatesData = [{ id: 'c1', election_id: 'target', name: 'Candidate 1', created_at: 1 }]; // aunque llame order(), responde []
    state.updateResultData = { id: 'target', status: 'OPEN' };

    svc.supabase = supabase;

    const res = await svc.openElection('target');
    expect(res).toBeTruthy();
  });

  it('should close election (happy path)', async () => {
    const svc = new ElectionService() as any;
    const { supabase, state, builder } = makeSupabaseMock();

    state.closeResultData = { id: 'e1', status: 'CLOSED' };
    svc.supabase = supabase;

    const res = await svc.closeElection('e1');

    // asegura que update se usó
    expect(builder.update).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  it('should NOT open election without candidates', async () => {
    const svc = new ElectionService() as any;
    const { supabase, state } = makeSupabaseMock();

    state.openElectionsData = [];
    state.electionData = { id: 'target', status: 'DRAFT' };
    state.candidatesData = []; // sin candidatos

    svc.supabase = supabase;

    await expect(svc.openElection('target')).rejects.toThrow('Cannot OPEN election without candidates');
  });

});