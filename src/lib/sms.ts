const WIGAL_API_KEY = import.meta.env.VITE_WIGAL_API_KEY;
const WIGAL_USERNAME = import.meta.env.VITE_WIGAL_USERNAME;
const SENDER_ID = 'USTED'; // You can change this in your Wigal dashboard

export async function sendWelcomeSMS(phoneNumber: string, name: string) {
  if (!WIGAL_API_KEY || !WIGAL_USERNAME || !phoneNumber) {
    console.warn('SMS skipped: Wigal credentials or phone number missing.');
    return;
  }

  // Ensure phone number starts with 233 if it's local
  let formattedPhone = phoneNumber.replace(/\s+/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '233' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('233') && !formattedPhone.startsWith('+')) {
    formattedPhone = '233' + formattedPhone;
  }
  formattedPhone = formattedPhone.replace('+', '');

  const message = `Welcome to USTED Scholar, ${name.split(' ')[0]}! 🎓 Your AI academic workspace is ready. Let's elevate your studies!`;

  try {
    const response = await fetch('https://frogapi.wigal.com.gh/api/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'USERNAME': WIGAL_USERNAME,
        'API-KEY': WIGAL_API_KEY
      },
      body: JSON.stringify({
        senderid: SENDER_ID,
        destinations: [
          {
            destination: formattedPhone,
            msgid: `WLCM_${Date.now()}` // Unique ID for tracking
          }
        ],
        message: message,
        smstype: 'text'
      })
    });

    const result = await response.json();
    console.log('📬 Wigal SMS Status:', result);
    return result;
  } catch (error) {
    console.error('❌ Wigal SMS Failed:', error);
  }
}
