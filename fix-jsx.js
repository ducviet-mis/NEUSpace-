const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/app/double-major/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `{!analysis ? <div className="py-12 text-center flex flex-col items-center opacity-60">
                    <Info size={40} className="mb-4 text-foreground/50" />
                    <p>Vui lòng chọn đủ 2 ngành học để xem danh sách môn.</p>
                  </div> : <>`;

const newStr = `{!analysis ? (
                  <div className="py-12 text-center flex flex-col items-center opacity-60">
                    <Info size={40} className="mb-4 text-foreground/50" />
                    <p>Vui lòng chọn đủ 2 ngành học để xem danh sách môn.</p>
                  </div>
                ) : (
                  <div className="tab-inner-content">`;

content = content.replace(new RegExp(oldStr.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'), newStr);
content = content.replace(/<\/>}/g, '</div>\n                )}');

fs.writeFileSync(path, content);
console.log("Replaced!");
