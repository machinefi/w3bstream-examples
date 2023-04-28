import { Simulator, DataPointGenerator} from "@w3bstream/w3bstream-http-client-simulator";

const PUB_ID ="meter"
const PUB_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJQYXlsb2FkIjoiOTIyMTEzNzY2NjU0Mzg4MTIyMSIsImlzcyI6InczYnN0cmVhbSJ9.nU_C7KqAUSgmE0foh5z8ja-A6F-6MY3OA4TQ7xsDm2s";
const W3BSTREAM_ENDPOINT = "http://localhost:3000/api/w3bapp/event/simple_smart_grid"
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

//const message = simulator.generateEvents(1);
//console.log(JSON.stringify(message));
simulator.powerOn(10);

