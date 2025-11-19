import { apiService } from './api';

class AIService {
  // Send message to AI backend proxy and fall back to local rules if needed
  async chat(message: string, farmStats?: any): Promise<string> {
    console.log('AI Chat called with:', {
      messageLength: message.length,
      hasFarmStats: !!farmStats,
      farmStatsKeys: farmStats ? Object.keys(farmStats) : []
    });

    try {
      const response = await apiService.sendAIMessage(message, farmStats);
      if (response?.reply) {
        console.log('Received AI reply from backend, length:', response.reply.length);
        return response.reply;
      }

      console.warn('AI response missing reply field, using fallback.');
      return this.getLocalAIResponse(message, farmStats);
    } catch (error: any) {
      console.error('Backend AI request failed, using fallback:', error?.message);
      return this.getLocalAIResponse(message, farmStats);
    }
  }

  // Local AI response (rule-based fallback)
  private getLocalAIResponse(message: string, farmStats?: any): string {
    const lowerMessage = message.toLowerCase();
    
    // Health-related questions
    if (lowerMessage.includes('مريض') || lowerMessage.includes('مرض') || lowerMessage.includes('صحة')) {
      if (farmStats?.sickChickens > 0) {
        return `لديك ${farmStats.sickChickens} دجاج مريض. أنصحك بـ:
1. عزل الدجاج المريض فوراً لمنع انتشار المرض
2. استشارة طبيب بيطري لتشخيص الحالة
3. تنظيف وتعقيم المكان بشكل جيد
4. مراقبة باقي الدجاج عن كثب
5. تسجيل جميع الأعراض في سجل الصحة`;
      }
      return 'حالياً لا توجد حالات مرضية مسجلة. استمر في المراقبة الدورية للدجاج.';
    }

    // Production questions
    if (lowerMessage.includes('إنتاج') || lowerMessage.includes('بيض') || lowerMessage.includes('إنتاجية')) {
      const avgDaily = farmStats ? Math.round((farmStats.weeklyEggs || 0) / 7) : 0;
      return `إنتاجك اليومي: ${farmStats?.todayEggs || 0} بيضة
المتوسط الأسبوعي: ${avgDaily} بيضة يومياً
إنتاج الشهر: ${farmStats?.monthlyEggs || 0} بيضة

لتحسين الإنتاج:
1. تأكد من التغذية المتوازنة
2. الحفاظ على الإضاءة المناسبة (14-16 ساعة يومياً)
3. توفير مياه نظيفة باستمرار
4. تقليل الضغط والتوتر للدجاج
5. مراقبة درجة الحرارة والرطوبة`;
    }

    // Financial questions
    if (lowerMessage.includes('ربح') || lowerMessage.includes('مال') || lowerMessage.includes('مكسب') || lowerMessage.includes('أرباح')) {
      const profit = farmStats?.todayProfit || 0;
      if (profit < 0) {
        return `الربح اليومي سالب: ${profit} دينار. أنصحك بـ:
1. مراجعة المصروفات وتقليل التكاليف غير الضرورية
2. زيادة المبيعات من خلال البحث عن عملاء جدد
3. تحسين كفاءة الإنتاج
4. مراجعة أسعار البيع
5. تحليل التكاليف المتغيرة والثابتة`;
      }
      return `الربح اليومي: ${profit} دينار
الربح الأسبوعي: ${farmStats?.weeklyProfit || 0} دينار
الربح الشهري: ${farmStats?.monthlyProfit || 0} دينار

لزيادة الأرباح:
1. تحسين معدل الإنتاج
2. تقليل معدل التلف
3. إدارة أفضل للمخزون
4. بناء علاقات طويلة الأمد مع العملاء
5. مراقبة الأسعار في السوق`;
    }

    // Damage rate questions
    if (lowerMessage.includes('تلف') || lowerMessage.includes('كسر') || lowerMessage.includes('تالف')) {
      const rate = farmStats?.damageRate || 0;
      if (rate > 10) {
        return `معدل التلف مرتفع: ${rate}%. هذا يحتاج تحسين فوري:
1. تحسين طريقة جمع البيض (جمع 2-3 مرات يومياً)
2. استخدام حاويات مناسبة للبيض
3. تجنب الازدحام في الأقفاص
4. تدريب العمال على التعامل الصحيح
5. فحص جودة العلف والمياه`;
      }
      return `معدل التلف: ${rate}% - هذا معدل جيد. استمر في الممارسات الحالية.`;
    }

    // General advice
    if (lowerMessage.includes('نصيحة') || lowerMessage.includes('مساعدة') || lowerMessage.includes('مشورة')) {
      return `نصائح عامة لإدارة المدجنة:
1. المراقبة اليومية للدجاج والصحة
2. تسجيل جميع البيانات بدقة
3. الحفاظ على النظافة والتعقيم
4. التغذية المتوازنة والمناسبة
5. إدارة المخزون بشكل فعال
6. بناء علاقات جيدة مع العملاء
7. تحليل البيانات بانتظام لاتخاذ قرارات مدروسة`;
    }

    // Default response
    return `شكراً لسؤالك. يمكنني مساعدتك في:
- نصائح حول صحة الدجاج
- تحسين الإنتاج
- إدارة الأرباح والمصروفات
- تقليل معدل التلف
- نصائح عامة لإدارة المدجنة

اطرح سؤالك بشكل أكثر تحديداً للحصول على إجابة أفضل.`;
  }
}

export const aiService = new AIService();
