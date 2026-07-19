{{- define "resources" }}
requests:
  memory: {{ pluck .Values.werf.env .Values.app.resources.memory | first | default .Values.app.resources.memory._default }}
  cpu: {{ pluck .Values.werf.env .Values.app.resources.cpu | first | default .Values.app.resources.cpu._default }}
limits:
  memory: {{ pluck .Values.werf.env .Values.app.resources.memory | first | default .Values.app.resources.memory._default }}
{{- end }}
