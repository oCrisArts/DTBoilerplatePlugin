export interface EstadoLicenca {
  geracaoGratuitaUtilizada: boolean;
  premium: boolean;
}

const FREE_GENERATION_USED_KEY = "dt_boilerplate_free_generation_used";
const SUPABASE_URL = "https://lyexuguaeuwdtjeqwmst.supabase.co";
const SUPABASE_API_KEY = "sb_publishable_BJYVAnl9Arx7gEcHOXzHfA_Bj4iJXGO"; // Replace with actual anon key

type ClientStorage = {
  getAsync: (key: string) => Promise<unknown>;
  setAsync: (key: string, value: unknown) => Promise<void>;
};

type FigmaUser = {
  id: string;
};

async function verificarAssinaturaSupabase(userId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/customers?user_id=eq.${userId}&select=subscription_status`,
      {
        headers: {
          "apikey": SUPABASE_API_KEY,
          "Authorization": `Bearer ${SUPABASE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Supabase API error:", response.statusText);
      return false;
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const subscriptionStatus = data[0].subscription_status;
      return subscriptionStatus === "active" || subscriptionStatus === "trialing" || subscriptionStatus === "past_due";
    }

    return false;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

export async function obterEstadoLicenca(clientStorage: ClientStorage, userId?: string): Promise<EstadoLicenca> {
  const geracaoGratuitaUtilizada = await clientStorage.getAsync(FREE_GENERATION_USED_KEY);
  
  let premium = false;
  
  if (userId) {
    premium = await verificarAssinaturaSupabase(userId);
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
