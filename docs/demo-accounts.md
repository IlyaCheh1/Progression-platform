# Учётные записи (локально / staging)

Пароли в plaintext в сиде `school-api` — **только для локальной разработки и staging**.

Excel-выгрузка: [`docs/accounts.xlsx`](./accounts.xlsx) (листы «Учётки» и «Служебные»).  
Пересобрать: `python scripts/export-accounts-xlsx.py`

School API по умолчанию: `127.0.0.1:8082`. Токены сессии выдаются при логине.

## Служебные роли

| Имя | Роль | Логин | Пароль |
|---|---|---|---|
| Администратор платформы | `administrator` | `admin@mastersword.ru` | `admin123` |
| Локальный ученик | `student` | `student@mastersword.ru` | `student123` |
| Опекун | `guardian` | `guardian@mastersword.ru` | `guardian123` |
| Тренер | `coach` | `coach@mastersword.ru` | `coach123` |
| Арендатор | `renter` | `renter@mastersword.ru` | `renter123` |
| Взрослый ученик | `student` | `adult@mastersword.ru` | `adult123` |

- Админ открывает `/admin`.
- Ученик — онбординг / кабинет профиля.

## Ученики из Excel

Источник: `Мастер Меча.xlsx` hash `389345302d95` as-of `2026-07-19`

Формат: `{имя-фамилия}@mastersword.ru` / `{имя}123`

| Имя | Роль | Логин | Пароль |
|---|---|---|---|
| Макс Киселев | `administrator` | `maks-kiselev@mastersword.ru` | `maks123` |
| Анатолий Бычков | `student` | `anatoliy-bychkov@mastersword.ru` | `anatoliy123` |
| Маргарита Тузова | `student` | `margarita-tuzova@mastersword.ru` | `margarita123` |
| Татьяна Грибанова | `administrator` | `tatyana-gribanova@mastersword.ru` | `tatyana123` |
| Николай Лобаев | `student` | `nikolay-lobaev@mastersword.ru` | `nikolay123` |
| Сергей Власенко | `student` | `sergey-vlasenko@mastersword.ru` | `sergey123` |
| Артем Шумилов | `student` | `artem-shumilov@mastersword.ru` | `artem123` |
| Иван Бобровский | `student` | `ivan-bobrovskiy@mastersword.ru` | `ivan123` |
| Алексей Шаповалов | `student` | `aleksey-shapovalov@mastersword.ru` | `aleksey123` |
| Дмитрий Каныгин | `student` | `dmitriy-kanygin@mastersword.ru` | `dmitriy123` |
| Анастасия Соловьева | `student` | `anastasiya-soloveva@mastersword.ru` | `anastasiya123` |
| Александра Жигачева | `student` | `aleksandra-zhigacheva@mastersword.ru` | `aleksandra123` |
| Кирилл Жигачев | `student` | `kirill-zhigachev@mastersword.ru` | `kirill123` |
| Ксения Измайловская | `student` | `kseniya-izmaylovskaya@mastersword.ru` | `kseniya123` |
| Маргарита Кукушкина | `student` | `margarita-kukushkina@mastersword.ru` | `margarita123` |
| Александра Селиванова | `student` | `aleksandra-selivanova@mastersword.ru` | `aleksandra123` |
| Константин Киселев | `student` | `konstantin-kiselev@mastersword.ru` | `konstantin123` |
| Даниил Киселев | `student` | `daniil-kiselev@mastersword.ru` | `daniil123` |
| Григорий Фирсов | `student` | `grigoriy-firsov@mastersword.ru` | `grigoriy123` |
| Дмитрий Круглов | `student` | `dmitriy-kruglov@mastersword.ru` | `dmitriy123` |
| Катерина Ветрова | `student` | `katerina-vetrova@mastersword.ru` | `katerina123` |
| Александр Лебедев | `student` | `aleksandr-lebedev@mastersword.ru` | `aleksandr123` |
| Наталья Кияшко | `student` | `natalya-kiyashko@mastersword.ru` | `natalya123` |
| Иван Ковальков | `student` | `ivan-kovalkov@mastersword.ru` | `ivan123` |
| Георгий Юкляевских | `student` | `georgiy-yuklyaevskih@mastersword.ru` | `georgiy123` |
| Павел Захаров | `student` | `pavel-zaharov@mastersword.ru` | `pavel123` |
| Александр Бузаев | `student` | `aleksandr-buzaev@mastersword.ru` | `aleksandr123` |
| Дмитрий Власов | `student` | `dmitriy-vlasov@mastersword.ru` | `dmitriy123` |
| Кирилл Шеламов | `student` | `kirill-shelamov@mastersword.ru` | `kirill123` |
| Никита Воробьев | `student` | `nikita-vorobev@mastersword.ru` | `nikita123` |
| Георгий Новиков | `student` | `georgiy-novikov@mastersword.ru` | `georgiy123` |
| Ульяна Грибанова | `student` | `ulyana-gribanova@mastersword.ru` | `ulyana123` |
| Кирилл Краснощеков | `student` | `kirill-krasnoschekov@mastersword.ru` | `kirill123` |
| Василиса Ляшук | `student` | `vasilisa-lyashuk@mastersword.ru` | `vasilisa123` |
| Деметра Яниди | `student` | `demetra-yanidi@mastersword.ru` | `demetra123` |
| Иннокентий Ордин | `student` | `innokentiy-ordin@mastersword.ru` | `innokentiy123` |
| Сергей Харламов | `student` | `sergey-harlamov@mastersword.ru` | `sergey123` |
| Сергей Шредер | `student` | `sergey-shreder@mastersword.ru` | `sergey123` |
| Илья Кузнецов | `student` | `ilya-kuznetsov@mastersword.ru` | `ilya123` |
| Лесли Алексис | `student` | `lesli-aleksis@mastersword.ru` | `lesli123` |
| Анна Егорова | `student` | `anna-egorova@mastersword.ru` | `anna123` |
| Софья Соколянская | `student` | `sofya-sokolyanskaya@mastersword.ru` | `sofya123` |
| Артур Арифуллин | `student` | `artur-arifullin@mastersword.ru` | `artur123` |
| Александр Дон | `student` | `aleksandr-don@mastersword.ru` | `aleksandr123` |
