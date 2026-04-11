import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import "./ApiDocsPage.css"

export default function ApiDocsPage() {
  return <SwaggerUI url="/openapi.yaml" />
}