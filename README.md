# country-graphQL
A graphQL API for country statistics\
The data is from World Bank open data\
Potentially more data sources and fields will be added
## Supported Query
```graphql
{
  country(code: "fr") {
    name
    iso2
    capitalCity
    longitude
    latitude
    
    GDP
    population
    GDPPerCapita
    GDPPerCapitaPPP
    lifeExpectancy
    GINI
    GDPGrowth
    exportsPerGDP
    importsPerGDP
    reserves
    expensePerGDP
    GDPPerCapitaGrowth
    grossSavingsPerGDP
    populationGrowth
    
    time(from:2000, to:2010) {
      date
      GDP
      population
      GDPPerCapita
      GDPPerCapitaPPP
      lifeExpectancy
      GINI
      GDPGrowth
      exportsPerGDP
      importsPerGDP
      reserves
      expensePerGDP
      GDPPerCapitaGrowth
      grossSavingsPerGDP
      populationGrowth
    }
  }
}
```
## How to run
Clone this repository\
then
```shell
npm install
npm run serve
```
You can also navigate to localhost:5000/graphql to interact with the API
