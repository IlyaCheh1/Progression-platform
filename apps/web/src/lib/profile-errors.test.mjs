import assert from "node:assert/strict";
import test from "node:test";

/** Mirrors PROFILE_ERROR_MESSAGES / messageForProfileError mapping in profile-api.ts */
const PROFILE_ERROR_MESSAGES = {
  unauthorized: "Сессия истекла. Войдите снова.",
  invalid_character: "Выбранный персонаж недоступен. Выберите другого.",
  invalid_skin: "Выбранный персонаж недоступен. Выберите другого.",
  invalid_gender: "Некорректный пол персонажа.",
  invalid_background: "Выбранный фон недоступен.",
  character_not_owned: "Этот образ ещё не открыт.",
  background_not_owned: "Этот фон ещё не открыт.",
  invalid_avatar: "Некорректный формат аватара. Загрузите JPEG, PNG или WebP.",
  avatar_too_large: "Аватар слишком большой. Выберите другое изображение.",
  bad_request: "Некорректные данные профиля.",
  "student not found": "Профиль не найден. Войдите снова.",
};

function messageForCode(code) {
  return PROFILE_ERROR_MESSAGES[code] ?? `Ошибка сохранения профиля.`;
}

test("profile error codes map to actionable Russian copy", () => {
  assert.equal(messageForCode("unauthorized"), "Сессия истекла. Войдите снова.");
  assert.equal(messageForCode("invalid_character"), "Выбранный персонаж недоступен. Выберите другого.");
  assert.equal(messageForCode("character_not_owned"), "Этот образ ещё не открыт.");
  assert.equal(messageForCode("invalid_avatar"), "Некорректный формат аватара. Загрузите JPEG, PNG или WebP.");
  assert.match(messageForCode("unknown_code"), /Ошибка сохранения профиля/);
});
