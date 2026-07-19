{{ define "nodeSelector" }}
{{- if eq (pluck .Values.werf.env .Values.nodeSelector.enable | first | default .Values.nodeSelector.enable._default) "true" }}
nodeSelector:
  dedicated: {{ pluck .Values.werf.env .Values.nodeSelector.value | first | default .Values.nodeSelector.value._default | quote }}
{{- end }}
{{ end }}

{{ define "tolerations" }}
{{- if eq (pluck .Values.werf.env .Values.tolerations.enable | first | default .Values.tolerations.enable._default) "true" }}
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: {{ pluck .Values.werf.env .Values.tolerations.value | first | default .Values.tolerations.value._default | quote }}
    effect: "NoExecute"
{{- end }}
{{ end }}

{{ define "nodeAffinity" }}
{{- if eq (pluck .Values.werf.env .Values.nodeAffinity.enable | first | default .Values.nodeAffinity.enable._default) "true" }}
{{- if eq (pluck .Values.werf.env .Values.nodeAffinity.type | first | default .Values.nodeAffinity.type._default) "preferredDuringSchedulingIgnoredDuringExecution" }}
nodeAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: {{ pluck .Values.werf.env .Values.nodeAffinity.weight | first | default .Values.nodeAffinity.weight._default }}
      preference:
        matchExpressions:
        - key: "{{ pluck .Values.werf.env .Values.nodeAffinity.key | first | default .Values.nodeAffinity.key._default }}"
          operator: {{ pluck .Values.werf.env .Values.nodeAffinity.operator | first | default .Values.nodeAffinity.operator._default }}
          values:
            - "{{ pluck .Values.werf.env .Values.nodeAffinity.value | first | default .Values.nodeAffinity.value._default }}"
{{- end }}
{{- if eq (pluck .Values.werf.env .Values.nodeAffinity.type | first | default .Values.nodeAffinity.type._default) "requiredDuringSchedulingIgnoredDuringExecution" }}
nodeAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    - weight: {{ pluck .Values.werf.env .Values.nodeAffinity.weight | first | default .Values.nodeAffinity.weight._default }}
      preference:
        matchExpressions:
        - key: "{{ pluck .Values.werf.env .Values.nodeAffinity.key | first | default .Values.nodeAffinity.key._default }}"
          operator: {{ pluck .Values.werf.env .Values.nodeAffinity.operator | first | default .Values.nodeAffinity.operator._default }}
          values:
            - "{{ pluck .Values.werf.env .Values.nodeAffinity.value | first | default .Values.nodeAffinity.value._default }}"
{{- end }}
{{- end }}
{{ end }}

{{ define "podAntiAffinity" }}
{{- if eq (pluck .Values.werf.env .Values.podAntiAffinity.enable | first | default .Values.podAntiAffinity.enable._default) "true" }}
{{- if eq (pluck .Values.werf.env .Values.podAntiAffinity.type | first | default .Values.podAntiAffinity.type._default) "preferredDuringSchedulingIgnoredDuringExecution" }}
podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: {{ pluck .Values.werf.env .Values.podAntiAffinity.weight | first | default .Values.podAntiAffinity.weight._default }}
      podAffinityTerm:
        labelSelector:
          matchExpressions:
            - key: {{ pluck .Values.werf.env .Values.podAntiAffinity.key | first | default .Values.podAntiAffinity.key._default }}
              operator: In
              values:
                - {{ pluck .Values.werf.env .Values.podAntiAffinity.value | first | default .Values.podAntiAffinity.value._default }}
        topologyKey: {{ pluck .Values.werf.env .Values.podAntiAffinity.topologyKey | first | default .Values.podAntiAffinity.topologyKey._default | quote }}
{{- end }}
{{- if eq (pluck .Values.werf.env .Values.podAntiAffinity.type | first | default .Values.podAntiAffinity.type._default) "requiredDuringSchedulingIgnoredDuringExecution" }}
podAntiAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchExpressions:
          - key: {{ pluck .Values.werf.env .Values.podAntiAffinity.key | first | default .Values.podAntiAffinity.key._default }}
            operator: In
            values:
              - {{ pluck .Values.werf.env .Values.podAntiAffinity.value | first | default .Values.podAntiAffinity.value._default }}
      topologyKey: {{ pluck .Values.werf.env .Values.podAntiAffinity.topologyKey | first | default .Values.podAntiAffinity.topologyKey._default | quote }}
{{- end }}
{{- end }}
{{ end }}
