import { Simulator, DataPointGenerator} from "@nick-iotex/w3bstream-http-client-simulator";

const PUB_ID ="meter2"
const PUB_TOKEN = ""
const W3BSTREAM_ENDPOINT = "http://localhost:3000"
const EVENT_TYPE = "DATA";
const EVENT_ID = "DATA";

type EnergyDataPoint = {
    sensor_reading: number;
    timestamp: number;
  };

const generatorFunction = () => ({
    sensor_reading: DataPointGenerator.randomizer(0, 12),
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

simulator.init();

simulator.dataPointGenerator = dataGenerator;

const message = simulator.generateEvents(1);

console.log(JSON.stringify(message));