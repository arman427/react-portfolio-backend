require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(helmet()); // безопасность HTTP заголовков

const HOUR = 60 * 60 * 1000;

const limiter = rateLimit({ //    запросов в час
   windowMs: HOUR,
   max: 10,
   message: 'Слишком много запросов, попробуйте отправить позже.'
});

function escapeHtml(text) {
   return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}


app.post('/send-gmail', limiter, async (req, res) => {
   try {
      const { name, phone, description } = req.body; // получаем данные из тела запроса req

      // Очищаем поля от потенциально опасных скриптов
      const safeName = escapeHtml(name.trim());
      const safePhone = escapeHtml(phone.trim());
      const safeDescription = escapeHtml(description.trim());

      const message = `
      🔔 <b>Новое сообщение с сайта!</b> 🔔

👤 <b>Имя:</b> ${safeName} 
📱 <b>Телефон:</b> ${safePhone} \n
📝 <b>Сообщение:</b> ${safeDescription}

⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</i>
      `;

      await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
         parse_mode: 'HTML'
      });

      res.status(200).json({ // ответ клиенту
         success: true,
         message: 'Письмо успешно отправлено!'
      });

   } catch (error) {
      console.error('Error sending email:', error); // логируем ошибку на сервере

      res.status(500).json({ // ответ клиенту в случае ошибки
         success: false,
         message: 'Ошибка при отправке сообщения',
      })
   }
});

app.get('/', (req, res) => {
   res.status(200).json('Server is running');
});
app.get('/health', (req, res) => {
   res.status(200).json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => { // слушаем порт (8080)
   console.log(`Server is running on http://localhost:${PORT}`);
});