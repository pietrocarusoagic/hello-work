@description('Environment name')
param environmentName string = 'hellowork-poc'

@description('Azure region')
param location string = resourceGroup().location

@description('Container image to deploy')
param containerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('SQL admin password')
@secure()
param sqlAdminPassword string

module containerApp 'modules/containerApp.bicep' = {
  name: 'containerApp'
  params: {
    environmentName: environmentName
    location: location
    containerImage: containerImage
  }
}

module sqlDb 'modules/sqlDatabase.bicep' = {
  name: 'sqlDatabase'
  params: {
    environmentName: environmentName
    location: location
    adminPassword: sqlAdminPassword
  }
}

module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'staticWebApp'
  params: {
    environmentName: environmentName
    location: location
  }
}

output backendUrl string = containerApp.outputs.url
output frontendUrl string = staticWebApp.outputs.url
output sqlServerFqdn string = sqlDb.outputs.serverFqdn
