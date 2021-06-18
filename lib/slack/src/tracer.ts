import opentelemetry from '@opentelemetry/api'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { NodeTracerProvider } from '@opentelemetry/node'
import { SimpleSpanProcessor } from '@opentelemetry/tracing'
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { Resource } from '@opentelemetry/resources'

const installTracing = () => {
  const provider = new NodeTracerProvider({
    resource: new Resource({ 'service.name': 'slack-ts' }),
  })

  const exporter = new ZipkinExporter()

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter))

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register()

  registerInstrumentations({
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  })
}

installTracing()
