export type SitradInstrument = {
  id: number
  name: string
  modelId: number
}


export interface IResult {
  code: string;
  name: string | null;
  values: IValue[];
}

export interface IValue {
  date: string;
  value: boolean | number | string | null;
  decimalPlaces: number;
  isInError: boolean;
  isEnabled: boolean;
  isFailPayload: boolean;
  measurementUnity?: string;
  measurementUnityId?: number;
}

export type SitradValuesResponse = {
  results?: IResult[]
  error?: string
}

export interface InstrumentWithValues {
  id: number;
  error?: string;
  GasPressure: number;
  IsErrorPressureSensor?: boolean;
  Setpoint1RelativeTemp: number;
  converterId: number;
  name: string;
  slug: string;
  address: number;
  statusId: number;
  status: string;
  modelId: number;
  modelVersion: number;
  IsAlarmsManuallyInhibited: boolean;
  IsSensorError: boolean;
  IsDeprogrammed: boolean;
  IsOpenDoor: boolean;
  dataloggerOn: boolean;
  IsDataloggerFull: boolean;
  IsClockDeprogrammed: boolean;
  IsAlarmOpenDoor: boolean;
  IsControlEnabled: boolean;
  hasControlsCommand: boolean;
  processTime: string;
  Temperature: number;
  IsDefrost: boolean;
  IsRefrigeration: boolean;
  IsHot: boolean;
  IsOutputFan: boolean;
  IsOutputRefr: boolean;
  IsOutputDefr1: boolean;
  IsErrorS1: boolean;
  enableOutputRefr: boolean;
  enableOutputDefr: boolean;
  enableOutputHot: boolean;
  enableInvertStatusCommand: boolean;
  enableProcessStatusTime: boolean;
  temperatureUnityType: number;
  type: string;
  normalizedName: string;
  setpointRelativeTemp: number;
  IsDataloggerCorrupted: boolean;
  IsManualDatalogger: boolean;
  dataloggerPercentUsage: number;
  internalRtc: string;
  FncSetpoint: number;
  CurrentSetpoint: number;
  CurrentDifferential: number;
  FncDifferential: number;
  fncDigitalInput: number;
  remainingInhibitionTime: number | null;
  Sensor1: number;
  Sensor2: number;
  ProcessStatusText?: string | null;
  ProcessStatus?: string | number;
}

export type InstrumentSnapshot = {
  id: number
  name: string
  modelId?: number | null
  error?: string
} & Partial<Omit<InstrumentWithValues, 'id' | 'name' | 'modelId' | 'error'>>

export type NormalizedReading = {
  id: string
  idSitrad: number
  name: string
  model: number
  type: string
  status: string
  isSensorError: boolean
  error: string | null
  value: number
  differential: number
  setPoint: number
}
