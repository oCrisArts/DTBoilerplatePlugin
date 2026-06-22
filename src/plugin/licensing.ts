export interface EstadoLicenca {
  geracaoGratuitaUtilizada: boolean;
  premium: boolean;
}

const FREE_GENERATION_USED_KEY = "dt_boilerplate_free_generation_used";
const USER_EMAIL_KEY = "dt_boilerplate_user_email";
const PREMIUM_STATUS_KEY = "dt_boilerplate_premium_status";
const EDGE_FUNCTION_URL = "https://lyexuguaeuwdtjeqwmst.supabase.co/functions/v1/verify-license";

type ClientStorage = {
  getAsync: (key: string) => Promise<unknown>;
  setAsync: (key: string, value: unknown) => Promise<void>;
};

export async function verificarAssinaturaSupabase(userId?: string, email?: string): Promise<boolean> {
  try {
    if (!email) return false;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    return data.premium === true;
  } catch (error) {
    return false;
  }
}

export async function obterEstadoLicenca(clientStorage: ClientStorage, userId?: string, emailForcado?: string): Promise<EstadoLicenca> {
  const geracaoGratuitaUtilizada = await clientStorage.getAsync(FREE_GENERATION_USED_KEY);
  const storedPremium = await clientStorage.getAsync(PREMIUM_STATUS_KEY) as boolean | undefined;
  const storedEmail = await clientStorage.getAsync(USER_EMAIL_KEY) as string | undefined;
  
  const emailToCheck = emailForcado || storedEmail;
  
  let premium = storedPremium === true;
  
  if (!premium && emailToCheck) {
    premium = await verificarAssinaturaSupabase(userId, emailToCheck);
    if (premium) {
      await clientStorage.setAsync(PREMIUM_STATUS_KEY, true);
    }
  }

  return {
    geracaoGratuitaUtilizada: geracaoGratuitaUtilizada === true,
    premium,
  };
}

export function podeGerarDesignTokens(licenca: EstadoLicenca) {
  return licenca.premium || !licenca.geracaoGratuitaUtilizada;
}

export async function marcarGeracaoGratuitaUtilizada(clientStorage: ClientStorage) {
  await clientStorage.setAsync(FREE_GENERATION_USED_KEY, true);
}