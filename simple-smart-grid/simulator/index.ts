import { Simulator, DataPointGenerator} from "@w3bstream/w3bstream-http-client-simulator";

const PUB_ID ="meter"
const PUB_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQYXlsb2FkIjoiOTIyMTEzNzg1NTUyNjg4MjMwNCIsImlzcyI6InczYnN0cmVhbSJ9.SC-WevmfL6lI84RWCdj_UHgR15QVeJ0YPdkaPTpFhOk";
const W3BSTREAM_ENDPOINT = "http://localhost:3000/api/w3bapp/event/simple_smart_grid"
const EVENT_TYPE = "DATA";
const EVENT_ID = "DATA";

type EnergyDataPoint = {
    sensor_reading: number;
    timestamp: number;
  };

const generatorFunction = () => ({
    sensor_reading: DataPointGenerator.randomizer(0, 6),
    timestamp: DataPointGenerator.timestampGenerator(),
  });

const dataGenerator = new DataPointGenerator<EnergyDataPoint>(
    generatorFunction
)

const simulator = new Simulator(
    PUB_ID,
    PUB_TOKEN,
    EVENT_TYPE,
    EVENT_ID,
    W3BSTREAM_ENDPOINT
  );

// Reads ore generate a new key pair
simulator.init();

simulator.dataPointGenerator = dataGenerator;

// Generates, signs and sends a data message every 10 seconds
simulator.powerOn(10);

