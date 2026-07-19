{{- define "app_env" }}
{{- range $key, $value := .Values.env.db }}
- name: {{ $key }}
  value: {{ pluck $.Values.werf.env $value | first | default $value._default | quote }}
{{- end }}
{{- range $key, $value := .Values.env.telegram }}
- name: {{ $key }}
  value: {{ pluck $.Values.werf.env $value | first | default $value._default | quote }}
{{- end }}
{{- range $key, $value := .Values.env.s3 }}
- name: {{ $key }}
  value: {{ pluck $.Values.werf.env $value | first | default $value._default | quote }}
{{- end }}
{{- end }}