const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios');

const typeDefs = gql`
  type Query {
    country(code: String!): Country
  }
  type Country {
    name: String
    iso2: String
    capitalCity: String
    longitude: String
    latitude: String
    time(from: Int!, to: Int!): [TimeSeries]

    GDP: String
    population: String
    GDPPerCapita: String
    GDPPerCapitaPPP: String
    lifeExpectancy: String
    GINI: String
    GDPGrowth: String
    exportsPerGDP: String
    importsPerGDP: String
    reserves: String
    expensePerGDP: String
    GDPPerCapitaGrowth: String
    grossSavingsPerGDP: String
    populationGrowth: String
  }

  type TimeSeries {
    date: String

    GDP: String
    population: String
    GDPPerCapita: String
    GDPPerCapitaPPP: String
    lifeExpectancy: String
    GINI: String
    GDPGrowth: String
    exportsPerGDP: String
    importsPerGDP: String
    reserves: String
    expensePerGDP: String
    GDPPerCapitaGrowth: String
    grossSavingsPerGDP: String
    populationGrowth: String
  }
`;


const indicators = {
    "population": "SP.POP.TOTL",
    "GDP": "NY.GDP.MKTP.CD",
    "GDPPerCapita": "NY.GDP.PCAP.CD",
    "GDPPerCapitaPPP": "NY.GDP.PCAP.PP.CD",
    "lifeExpectancy": "SP.DYN.LE00.IN",
    "GINI": "SI.POV.GINI",
    "GDPGrowth": "NY.GDP.MKTP.KD.ZG",
    "exportsPerGDP": "NE.EXP.GNFS.ZS",
    "importsPerGDP": "NE.IMP.GNFS.ZS",
    "reserves": "FI.RES.TOTL.CD",
    "expensePerGDP": "GC.XPN.TOTL.GD.ZS",
    "GDPPerCapitaGrowth": "NY.GDP.PCAP.KD.ZG",
    "grossSavingsPerGDP": "NY.GNS.ICTR.ZS",
    "populationGrowth": "SP.POP.GROW"
}

const wburl = 'http://api.worldbank.org/v2/country/'

const currentSearch = (fields, iso2, data) => {
    const requestedIndicators = fields.map(f => indicators[f]).join(';')
    return axios.get(wburl+iso2+`/indicator/${requestedIndicators}?date=${(new Date().getFullYear())-1}&source=2&per_page=10000&format=json`).then(response => {
        // console.log(response.data[1])
        for (let d of response.data[1]) {
            data[d.indicator.id] = d.value
        }
        return data
    })
}

const getRequestedFields = info => {
    const requestedFields = []
    for (let f of info.fieldNodes[0].selectionSet.selections) {
        if (indicators[f.name.value]) {
            requestedFields.push(f.name.value)
        }
    }
    return requestedFields
}
const timeSearch = (fields, iso2, from, to) => {
    const previousYear = (new Date().getFullYear()) - 1
    from = Math.max(from, 0)
    to = Math.max(to, 0)
    to = Math.min(to, previousYear)
    from = Math.min(from, to)
    const requestedIndicators = fields.map(f => indicators[f]).join(';')
    const date = from + ':' + to
    const url = wburl+iso2+`/indicator/${requestedIndicators}?date=${date}&source=2&per_page=10000&format=json`
    return axios.get(url).then(response => {
        const timeSeries = []
        for (let d of response.data[1]) {
            if (!timeSeries[Number(d.date)-from]) {
                timeSeries[Number(d.date)-from] = {}
                timeSeries[Number(d.date)-from]['date'] = d.date
            }
            timeSeries[Number(d.date)-from][d.indicator.id] = d.value
        }
        return timeSeries
    }) 
}

const indicatorResolvers = {}
for (let indicator in indicators) {
    indicatorResolvers[indicator] = function(parent) {
        return indicatorSearch(indicator, parent.iso2Code, parent.date)
    }
}
const reverseIndicators = {}
for (let indicator in indicators) {
    reverseIndicators[indicator] = function(parent) {
        return parent[indicators[indicator]]
    }
}

const resolvers = {
  Query: {
    country(parent, args, context, info) {
        return axios.get(wburl+args.code+'?format=json').then(response => {
            const requestedFields = getRequestedFields(info)
            return currentSearch(requestedFields, response.data[1][0].iso2Code, response.data[1][0])
        })
    }
  },
  Country: {
    iso2(parent) {
        return parent.iso2Code
    },
    time(parent, args, context, info) {
        return timeSearch(getRequestedFields(info), parent.iso2Code, args.from, args.to)
    },
    ...reverseIndicators
  },
  TimeSeries: {
    date(parent) {
        return parent.date
    },
    ...reverseIndicators
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });

app.listen({ port: 5000 }, () =>
  console.log('Now browse to http://localhost:5000' + server.graphqlPath)
);
