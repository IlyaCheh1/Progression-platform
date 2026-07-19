{{- define "livenessProbe" }}
initialDelaySeconds: 15
periodSeconds: 10
timeoutSeconds: 5
failureThreshold: 3
httpGet:
  port: {{ pluck .Values.werf.env .Values.env.app_config.OGC_SERVER__INTERNAL__PORT | first | default .Values.env.app_config.OGC_SERVER__INTERNAL__PORT._default }}
  path: /health
{{- end }}

{{- define "readinessProbe" }}
initialDelaySeconds: 15
periodSeconds: 10
timeoutSeconds: 5
failureThreshold: 3
httpGet:
  port: {{ pluck .Values.werf.env .Values.env.app_config.OGC_SERVER__INTERNAL__PORT | first | default .Values.env.app_config.OGC_SERVER__INTERNAL__PORT._default }}
  path: /ready
{{- end }}
