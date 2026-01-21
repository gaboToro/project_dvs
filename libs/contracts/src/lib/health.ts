export type HealthPayload = {
  status: 'ok';
  service: string;
};

export const createHealthPayload = (service: string): HealthPayload => ({
  status: 'ok',
  service,
});
