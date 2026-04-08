import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import "../styles_new/swagger-ui.css"

export default function ApiDocsPage() {
  return <SwaggerUI url="/openapi.yaml" />
}