export interface EstadoLicenca {
  geracaoGratuitaUtilizada: boolean;
  premium: boolean;
}

const FREE_GENERATION_USED_KEY = "dt_boilerplate_free_generation_used";
const USER_EMAIL_KEY = "dt_boilerplate_user_email";
const SUPABASE_URL = "https://lyexuguaeuwdtjeqwmst.supabase.co";
const SUPABASE_API_KEY = "sb_publishable_BJYVAnl9Arx7gEcHOXzHfA_Bj4iJXGO";

type ClientStorage = {
  getAsync: (key: string) => Promise<unknown>;
  setAsync: (key: string, value: unknown) => Promise<void>;
};

export async function verificarAssinaturaSupabase(userId?: string, email?: string): Promise<boolean> {
  try {
    let query = `${SUPABASE_URL}/rest/v1/customers?select=subscription_status,lifetime&`;
    
    if (email) {
        query += `email=eq.${encodeURIComponent(email)}`;
    } else if (userId) {
        query += `user_id=eq.${encodeURIComponent(userId)}`;
    } else {
        return false;
    }

    const response = await fetch(query, {
      headers: {
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const sub = data[0];
      return sub.subscription_status === "active" || sub.lifetime === true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

export async function obterEstadoLicenca(clientStorage: ClientStorage, userId?: string, emailForcado?: string): Promise<EstadoLicenca> {
  const geracaoGratuitaUtilizada = await clientStorage.getAsync(FREE_GENERATION_USED_KEY);
  const storedEmail = await clientStorage.getAsync(USER_EMAIL_KEY) as string | undefined;
  
  const emailToCheck = emailForcado || storedEmail;
  
  let premium = false;
  if (userId || emailToCheck) {
    premium = await verificarAssinaturaSupabase(userId, emailToCheck);
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