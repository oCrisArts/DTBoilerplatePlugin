export interface EstadoLicenca {
  geracaoGratuitaUtilizada: boolean;
  premium: boolean;
}

const FREE_GENERATION_USED_KEY = "dt_boilerplate_free_generation_used";

type ClientStorage = {
  getAsync: (key: string) => Promise<unknown>;
  setAsync: (key: string, value: unknown) => Promise<void>;
};

export async function obterEstadoLicenca(clientStorage: ClientStorage): Promise<EstadoLicenca> {
  const geracaoGratuitaUtilizada = await clientStorage.getAsync(FREE_GENERATION_USED_KEY);

  return {
    geracaoGratuitaUtilizada: geracaoGratuitaUtilizada === true,
    premium: false,
  };
}

export function podeGerarDesignTokens(licenca: EstadoLicenca) {
  return licenca.premium || !licenca.geracaoGratuitaUtilizada;
}

export async function marcarGeracaoGratuitaUtilizada(clientStorage: ClientStorage) {
  await clientStorage.setAsync(FREE_GENERATION_USED_KEY, true);
}
