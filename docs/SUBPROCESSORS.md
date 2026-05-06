# Sub-procesadores de evaluacosas
**Versión**: 1.0 · 2026-05-06

Lista pública de los servicios externos que procesan datos personales en nombre de TLP.

| # | Sub-procesador | Tipo de dato | Localización | DPA |
|---|---|---|---|---|
| 1 | Google Cloud (Run, Firestore, Storage) | Entregas, audit logs | us-central1, us-east1 | [link](https://cloud.google.com/terms/data-processing-addendum) |
| 2 | Google Workspace | Identidad docente | us / global | [link](https://workspace.google.com/terms/dpa_terms.html) |
| 3 | Google Gemini API | Solo cuando se activa "calificar con IA" — entregas anónimas | us | [link](https://cloud.google.com/terms/data-processing-addendum) |
| 4 | Cloudflare | DNS, traffic metadata | global | [link](https://www.cloudflare.com/cloudflare-customer-dpa/) |
| 5 | GitHub (Microsoft) | Code, Pages, mirror privado de submits | us / global | [link](https://docs.github.com/en/site-policy/privacy-policies/github-data-protection-agreement) |
| 6 | Supabase | DB redundante | us-east-1 | [link](https://supabase.com/legal/dpa) |
| 7 | Linear | Issue tracking de submits | us | [link](https://linear.app/dpa) |
| 8 | gometa.org (TSE proxy) | Solo si activás lookup TSE — cédula | CR | N/A (padrón público) |
| 9 | Apify (TSE alternativo) | Solo si activás lookup TSE — cédula | global | [link](https://apify.com/dpa) |

## Cambios

Cuando agregamos o retiramos un sub-procesador, lo notificamos:
- En esta página (commit con fecha)
- En el sitio (banner en home si es cambio material)
- Por email a docentes/estudiantes activos si afecta sus datos

## Cómo objetar

Si no estás de acuerdo con un sub-procesador, podés:
- Pedir borrado de tus datos: `joaquin.munoz@thelaunchpadtlp.education`
- Dejar de usar el servicio (no hay obligación, es académico interno)

## Última actualización
**2026-05-06** — versión inicial publicada.
