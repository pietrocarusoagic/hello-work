param environmentName string
param location string

resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: '${environmentName}-frontend'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: ''
    branch: 'main'
    buildProperties: {
      appLocation: 'frontend'
      outputLocation: 'dist'
    }
  }
}

output url string = 'https://${staticWebApp.properties.defaultHostname}'
