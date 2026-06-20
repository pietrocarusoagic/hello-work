param environmentName string
param location string
@secure()
param adminPassword string

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: '${environmentName}-sql'
  location: location
  properties: {
    administratorLogin: 'helloworkadmin'
    administratorLoginPassword: adminPassword
    minimalTlsVersion: '1.2'
  }
}

resource sqlFirewall 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: 'HelloWorkDb'
  location: location
  sku: {
    name: 'GP_S_Gen5_2'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 2
  }
  properties: {
    autoPauseDelay: 60
    minCapacity: json('0.5')
  }
}

output serverFqdn string = sqlServer.properties.fullyQualifiedDomainName
output connectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=HelloWorkDb;User ID=helloworkadmin;Password=${adminPassword};Encrypt=true;'
