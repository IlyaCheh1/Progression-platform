{{- define "volume_mounts" }}
- name: app-config
  mountPath: /app/configs/values.yml
  subPath: config.yaml
{{- end }}

{{- define "volumes" }}
- name: app-config
  configMap:
    name: {{ .Chart.Name }}-config
{{- end }}