import {mapValues} from "lodash";

export enum Env {
  Uat = 'Uat',
  Prod = 'Prod',
}

export const DomainName:{[key in Env]: string} = {
  [Env.Uat]: 'uat.lazyinvoice.xyz',
  [Env.Prod]: 'lazyinvoice.xyz',
}

enum ExportName{
  hostedZoneIdExportName = "HostedZoneId",
}

const getExportNames =(env: Env) => mapValues(ExportName, (value) => `LazyInovice${env}${value}`)

export const UatExportNames = getExportNames(Env.Uat)
export const ProdExportNames = getExportNames(Env.Prod)

export type Outputs = ReturnType<typeof getExportNames>