// hrms-proxy Edge Function
// Proxies authentication and employee profile requests to HRMS/IDMS APIs

const HRMS_AUTH_URL = 'https://mobiledev.advanceagro.net/ws/api/idms/authentication/'
const HRMS_EMPLOYEE_URL = 'https://api-idms.advanceagro.net/hrms/employee/'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()

    if (action === 'login') {
      // params: account, password, Service, AgentId, AgentCode
      const queryParams = new URLSearchParams(params).toString()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000) // 12s timeout

      try {
        const response = await fetch(`${HRMS_AUTH_URL}?${queryParams}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        const data = await response.json()
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        const isTimeout = fetchError.name === 'AbortError'
        return new Response(JSON.stringify({ 
          error: isTimeout 
            ? 'HRMS server timeout - เซิร์ฟเวอร์ HRMS ไม่ตอบสนอง' 
            : `HRMS connection failed: ${fetchError.message}`
        }), {
          status: isTimeout ? 504 : 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } 
    
    else if (action === 'profile') {
      const { empId } = params
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await fetch(`${HRMS_EMPLOYEE_URL}${empId}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        const data = await response.json()
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (fetchError) {
        clearTimeout(timeoutId)
        return new Response(JSON.stringify({ 
          error: `Employee profile fetch failed: ${fetchError.message}`
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
