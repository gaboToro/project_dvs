// test unitario / unit test
const supabaseClientMock = {
  getSupabaseAdmin: jest.fn(),
};

jest.mock('./supabase.client', () => supabaseClientMock);

/**
 * Creates a chainable Supabase query builder mock.
 */
function makeSupabaseMock() {
  const state: any = {
    openElectionsData: [],
    electionData: { id: 'target', status: 'DRAFT' },
    candidatesData: [],
    updateResultData: { id: 'target', status: 'OPEN' },
    closeResultData: { id: 'e1', status: 'CLOSED' },
  };

  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    update: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    single: jest.fn(async () => ({ data: null, error: null })),
    maybeSingle: jest.fn(async () => ({ data: null, error: null })),
  };

  const supabase = {
    from: jest.fn(() => {
      builder.single.mockImplementation(async () => {
        const lastUpdateArgs = builder.update.mock.calls.at(-1)?.[0];
        if (lastUpdateArgs?.status === 'CLOSED') {
          return { data: state.closeResultData, error: null };
        }
        if (lastUpdateArgs?.status === 'OPEN') {
          return { data: state.updateResultData, error: null };
        }
        return { data: state.electionData, error: null };
      });

      builder.then = (resolve: any) => {
        if (builder.order.mock.calls.length > 0) {
          return resolve({ data: state.candidatesData, error: null });
        }
        if (builder.eq.mock.calls.some((c: any[]) => c?.[0] === 'status' && c?.[1] === 'OPEN')) {
          return resolve({ data: state.openElectionsData, error: null });
        }
        return resolve({ data: [], error: null });
      };

      return builder;
    }),
  };

  return { supabase, builder, state };
}

// Suite: ElectionService (unit) - agrupa pruebas relacionadas / Suite: ElectionService (unit) - grouping of related tests
describe('ElectionService (unit)', () => {
  // Caso de prueba: should enforce single OPEN election rule - comportamiento esperado bajo condiciones especificas / Test case: should enforce single OPEN election rule - expected behavior under specific conditions
  it('should enforce single OPEN election rule', async () => {
    const { supabase, state } = makeSupabaseMock();
    supabaseClientMock.getSupabaseAdmin.mockReturnValue(supabase);
    const { ElectionService } = require('./election.service');
    const svc = new ElectionService() as any;

    state.openElectionsData = [{ id: 'other-open' }];
    svc.supabase = supabase;

    await expect(svc.openElection('target')).rejects.toThrow('There is already an OPEN election');
  });

  // Caso de prueba: should open election when no other OPEN election exists - comportamiento esperado bajo condiciones especificas / Test case: should open election when no other OPEN election exists - expected behavior under specific conditions
  it('should open election when no other OPEN election exists', async () => {
    const { supabase, state } = makeSupabaseMock();
    supabaseClientMock.getSupabaseAdmin.mockReturnValue(supabase);
    const { ElectionService } = require('./election.service');
    const svc = new ElectionService() as any;

    state.openElectionsData = [];
    state.electionData = { id: 'target', status: 'DRAFT' };
    state.candidatesData = [{ id: 'c1', election_id: 'target', name: 'Candidate 1', created_at: 1 }];
    state.updateResultData = { id: 'target', status: 'OPEN' };

    svc.supabase = supabase;

    const res = await svc.openElection('target');
    expect(res).toBeTruthy();
  });

  // Caso de prueba: should close election (happy path) - comportamiento esperado bajo condiciones especificas / Test case: should close election (happy path) - expected behavior under specific conditions
  it('should close election (happy path)', async () => {
    const { supabase, state, builder } = makeSupabaseMock();
    supabaseClientMock.getSupabaseAdmin.mockReturnValue(supabase);
    const { ElectionService } = require('./election.service');
    const svc = new ElectionService() as any;

    state.closeResultData = { id: 'e1', status: 'CLOSED' };
    svc.supabase = supabase;

    const res = await svc.closeElection('e1');

    expect(builder.update).toHaveBeenCalled();
    expect(res).toBeTruthy();
  });

  // Caso de prueba: should NOT open election without candidates - comportamiento esperado bajo condiciones especificas / Test case: should NOT open election without candidates - expected behavior under specific conditions
  it('should NOT open election without candidates', async () => {
    const { supabase, state } = makeSupabaseMock();
    supabaseClientMock.getSupabaseAdmin.mockReturnValue(supabase);
    const { ElectionService } = require('./election.service');
    const svc = new ElectionService() as any;

    state.openElectionsData = [];
    state.electionData = { id: 'target', status: 'DRAFT' };
    state.candidatesData = [];

    svc.supabase = supabase;

    await expect(svc.openElection('target')).rejects.toThrow('Cannot OPEN election without candidates');
  });
});
