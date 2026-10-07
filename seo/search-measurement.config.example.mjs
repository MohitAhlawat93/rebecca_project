const env = (name) => String(process.env[name] || '').trim();

export const SEARCH_MEASUREMENT = {
  schemaVersion: 1,
  id: 'client-search-measurement',
  clientId: 'client-id',
  productionOrigin: 'https://www.example.com',
  sync: {
    enabled: true,
    schedule: '23 4 * * *',
    lookbackDays: 35,
    providers: ['google', 'bing'],
    persistence: 'supabase'
  },
  reporting: {
    currentWindowDays: 28,
    comparisonWindowDays: 28,
    finalizedLagDays: 3,
    timezone: 'UTC',
    minimumImpressions: 40,
    minimumQueryImpressions: 20,
    lowCtrThreshold: 0.025,
    strikingDistanceMinPosition: 4,
    strikingDistanceMaxPosition: 15,
    materialChangeRatio: 0.3,
    maximumRecommendations: 20
  },
  providers: {
    google: {
      standard: {
        mode: 'api',
        property: env('GSC_SITE_URL'),
        tokenEnv: 'GSC_ACCESS_TOKEN',
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
        searchTypes: ['web', 'image'],
        dimensions: ['date', 'query', 'page', 'country', 'device'],
        rowLimit: 25000,
        capabilities: {
          clicks: true,
          impressions: true,
          ctr: true,
          position: true,
          query: true,
          page: true,
          country: true,
          device: true,
          searchAppearance: true
        }
      },
      generativeAi: {
        mode: 'report-export',
        capabilities: {
          impressions: true,
          pages: true,
          countries: true,
          devices: true,
          dates: true
        },
        apiStatus: 'not-documented-in-search-analytics-api'
      },
      multimodal: {
        mode: 'report-export',
        capabilities: {
          performanceFilter: true,
          searchAndGenerativeAiReports: true
        },
        apiStatus: 'not-documented-in-search-analytics-api'
      }
    },
    bing: {
      standard: {
        mode: 'api-or-export',
        siteUrl: env('BING_SITE_URL'),
        apiKeyEnv: 'BING_WEBMASTER_API_KEY',
        oauthTokenEnv: 'BING_WEBMASTER_ACCESS_TOKEN',
        capabilities: {
          clicks: true,
          impressions: true,
          ctr: true,
          position: true,
          query: true,
          page: true
        }
      },
      aiPerformance: {
        mode: 'portal-export',
        capabilities: {
          citations: true,
          citedPages: true,
          groundingQueries: true,
          topics: true,
          intents: true,
          trend: true
        },
        apiStatus: 'no-public-ai-performance-api-documented'
      }
    }
  },
  intelligence: {
    allowAutoPublish: false,
    requireHumanApproval: true,
    safeActionsOnly: true,
    prohibitedRecommendations: [
      'mass-generate-location-pages',
      'keyword-stuffing',
      'fake-backlinks',
      'fake-reviews',
      'safe-search-evasion',
      'auto-publish-ai-content'
    ]
  }
};

// Durable OAuth/token storage also requires:
 // SEARCH_STORE_SECRET
 // SEARCH_TOKEN_ENCRYPTION_KEY
 // SEARCH_OAUTH_STATE_SECRET
 // SEARCH_OAUTH_REDIRECT_ORIGIN
 // CRON_SECRET
 //
 // Google OAuth client:
 // GOOGLE_SEARCH_CLIENT_ID
 // GOOGLE_SEARCH_CLIENT_SECRET
 // GSC_SITE_URL
 //
 // Bing OAuth client:
 // BING_WEBMASTER_CLIENT_ID
 // BING_WEBMASTER_CLIENT_SECRET
 // BING_SITE_URL
 //
 // Keep all credentials server-side.
 // Never represent an export-only report as a live API connection.
