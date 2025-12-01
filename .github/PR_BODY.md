Añade helper `requireEnv`, refactoriza `app/supabase.ts` y `app/actions.ts` para validar claves,
añade `scripts/check-env.js` y actualiza documentación.

Cambios principales:
- `app/utils/requireEnv.ts`: helper para validar env vars.
- `app/supabase.ts`: usa requireEnv en lugar de non-null assertions.
- `app/actions.ts`: mensajes claros y preferencia por GOOGLE_MAPS_API_KEY_FIXED.
- `scripts/check-env.js`: script de verificación local.
- `README.md` y `.github/copilot-instructions.md`: documentación actualizada.

Checklist:
- [x] Código
- [x] Documentación
- [ ] Tests (pendiente)
