const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/app/double-major/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalRegex = /\{\/\* ===== FAQ MODAL ===== \*\/\}[\s\S]*?\{showFaqTab && \([\s\S]*?<\/div>\s*?\)\s*?\}/;

// extract it
const modalMatch = content.match(modalRegex);
if (modalMatch) {
  const modalString = modalMatch[0];
  // remove it from its current position
  content = content.replace(modalString, '');

  // wrap return with Fragment and put modal outside the space-y-6 div
  const returnPattern = '  return (\n    <div className="space-y-6 pb-12 animate-in fade-in duration-500">';
  
  const newReturn = `  return (
    <>
      ${modalString}

      <div className="space-y-6 pb-12 animate-in fade-in duration-500">`;
      
  content = content.replace(returnPattern, newReturn);
  
  // also add closing Fragment at the very end
  content = content.replace(/    <\/div>\n  \);\n\}/, '    </div>\n    </>\n  );\n}');
  
  fs.writeFileSync(path, content);
  console.log("Modal moved to root of component successfully!");
} else {
  console.log("Could not find Modal in page.tsx");
}
