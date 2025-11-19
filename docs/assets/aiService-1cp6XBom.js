import{a as l}from"./index-D1EyMSKz.js";class o{async chat(c,e){console.log("AI Chat called with:",{messageLength:c.length,hasFarmStats:!!e,farmStatsKeys:e?Object.keys(e):[]});try{const n=await l.sendAIMessage(c,e);return n!=null&&n.reply?(console.log("Received AI reply from backend, length:",n.reply.length),n.reply):(console.warn("AI response missing reply field, using fallback."),this.getLocalAIResponse(c,e))}catch(n){return console.error("Backend AI request failed, using fallback:",n==null?void 0:n.message),this.getLocalAIResponse(c,e)}}getLocalAIResponse(c,e){const n=c.toLowerCase();if(n.includes("مريض")||n.includes("مرض")||n.includes("صحة"))return(e==null?void 0:e.sickChickens)>0?`لديك ${e.sickChickens} دجاج مريض. أنصحك بـ:
1. عزل الدجاج المريض فوراً لمنع انتشار المرض
2. استشارة طبيب بيطري لتشخيص الحالة
3. تنظيف وتعقيم المكان بشكل جيد
4. مراقبة باقي الدجاج عن كثب
5. تسجيل جميع الأعراض في سجل الصحة`:"حالياً لا توجد حالات مرضية مسجلة. استمر في المراقبة الدورية للدجاج.";if(n.includes("إنتاج")||n.includes("بيض")||n.includes("إنتاجية")){const i=e?Math.round((e.weeklyEggs||0)/7):0;return`إنتاجك اليومي: ${(e==null?void 0:e.todayEggs)||0} بيضة
المتوسط الأسبوعي: ${i} بيضة يومياً
إنتاج الشهر: ${(e==null?void 0:e.monthlyEggs)||0} بيضة

لتحسين الإنتاج:
1. تأكد من التغذية المتوازنة
2. الحفاظ على الإضاءة المناسبة (14-16 ساعة يومياً)
3. توفير مياه نظيفة باستمرار
4. تقليل الضغط والتوتر للدجاج
5. مراقبة درجة الحرارة والرطوبة`}if(n.includes("ربح")||n.includes("مال")||n.includes("مكسب")||n.includes("أرباح")){const i=(e==null?void 0:e.todayProfit)||0;return i<0?`الربح اليومي سالب: ${i} دينار. أنصحك بـ:
1. مراجعة المصروفات وتقليل التكاليف غير الضرورية
2. زيادة المبيعات من خلال البحث عن عملاء جدد
3. تحسين كفاءة الإنتاج
4. مراجعة أسعار البيع
5. تحليل التكاليف المتغيرة والثابتة`:`الربح اليومي: ${i} دينار
الربح الأسبوعي: ${(e==null?void 0:e.weeklyProfit)||0} دينار
الربح الشهري: ${(e==null?void 0:e.monthlyProfit)||0} دينار

لزيادة الأرباح:
1. تحسين معدل الإنتاج
2. تقليل معدل التلف
3. إدارة أفضل للمخزون
4. بناء علاقات طويلة الأمد مع العملاء
5. مراقبة الأسعار في السوق`}if(n.includes("تلف")||n.includes("كسر")||n.includes("تالف")){const i=(e==null?void 0:e.damageRate)||0;return i>10?`معدل التلف مرتفع: ${i}%. هذا يحتاج تحسين فوري:
1. تحسين طريقة جمع البيض (جمع 2-3 مرات يومياً)
2. استخدام حاويات مناسبة للبيض
3. تجنب الازدحام في الأقفاص
4. تدريب العمال على التعامل الصحيح
5. فحص جودة العلف والمياه`:`معدل التلف: ${i}% - هذا معدل جيد. استمر في الممارسات الحالية.`}return n.includes("نصيحة")||n.includes("مساعدة")||n.includes("مشورة")?`نصائح عامة لإدارة المدجنة:
1. المراقبة اليومية للدجاج والصحة
2. تسجيل جميع البيانات بدقة
3. الحفاظ على النظافة والتعقيم
4. التغذية المتوازنة والمناسبة
5. إدارة المخزون بشكل فعال
6. بناء علاقات جيدة مع العملاء
7. تحليل البيانات بانتظام لاتخاذ قرارات مدروسة`:`شكراً لسؤالك. يمكنني مساعدتك في:
- نصائح حول صحة الدجاج
- تحسين الإنتاج
- إدارة الأرباح والمصروفات
- تقليل معدل التلف
- نصائح عامة لإدارة المدجنة

اطرح سؤالك بشكل أكثر تحديداً للحصول على إجابة أفضل.`}}const g=new o;export{g as aiService};
