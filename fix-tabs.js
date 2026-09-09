const fs = require('fs');
const path = 'C:/Users/Admin/.gemini/antigravity/scratch/neu-student-utility/src/app/double-major/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. We want to close the `analysis && stats` block right after the Overview (Tổng quan), 
// which ends just before `{/* ===== KHU VỰC CHI TIẾT:`

content = content.replace(
  '          {/* ===== KHU VỰC CHI TIẾT:', 
  '        </div>\n      )}\n\n      {/* ===== KHU VỰC CHI TIẾT:'
);

// 2. We also need to remove the original closing brackets of the `analysis && stats` block 
// which are at the very bottom of the page.
// The original bottom of the page looks like:
//               )}
//             </div>
//           </div>
//
//           {/* Main Content END
//
// Actually, earlier we did:
// "              )}\n" + faqTabContent + "            </div>\n          </div>\n\n          {/* Main Content END"
// Wait, the very end of that block was:
//         </div>
//       )}
//     </DashboardLayout>
// Let's replace the last `        </div>\n      )}\n    </DashboardLayout>` with `        </div>\n    </DashboardLayout>` or similar.
const bottomClosingRegex = / {8}<\/div>\n {6}\)}\n {4}<\/DashboardLayout>/;
content = content.replace(bottomClosingRegex, '        </div>\n    </DashboardLayout>');
content = content.replace(/ {8}<\/div>\n {6}\)}\n\n {4}<\/DashboardLayout>/, '        </div>\n    </DashboardLayout>');
content = content.replace(/<\/div>\s*?}\)\s*?<\/DashboardLayout>/, '</div>\n    </DashboardLayout>'); // more flexible

// 3. Make stats optional in Tab Headers
content = content.replace(/stats\.sharedReqCount/g, 'stats?.sharedReqCount || 0');
content = content.replace(/stats\.extraReqCount/g, 'stats?.extraReqCount || 0');
content = content.replace(/stats\.extraElectiveCount/g, 'stats?.extraElectiveCount || 0');
content = content.replace(/analysis\.totalM2Electives/g, 'analysis?.totalM2Electives || 0');

// 4. Wrap Tab contents 1, 2, 3 so they handle `!analysis`
const emptyStateMsg = `<div className="py-12 text-center flex flex-col items-center opacity-60">
                    <Info size={40} className="mb-4 text-foreground/50" />
                    <p>Vui lòng chọn đủ 2 ngành học để xem danh sách môn.</p>
                  </div>`;

// Tab 1: shared
content = content.replace(
  /<div className="animate-in fade-in duration-300">\n\s*<h3 className="text-lg font-semibold mb-1 text-green-500">/g,
  `<div className="animate-in fade-in duration-300">
                  {!analysis ? ${emptyStateMsg} : <>
                  <h3 className="text-lg font-semibold mb-1 text-green-500">`
);

// We need to close the `<>` right before `</div` at the end of tab 1 content.
// Wait, `</div` for Tab 1 ends right before `{/* ===== TAB 2`
content = content.replace(
  /                  \)\}\n                <\/div>\n              \)\}\n\n              \{\/\* ===== TAB 2/g,
  `                  )}\n                  </>}\n                </div>\n              )}\n\n              {/* ===== TAB 2`
);

// Tab 2: required_extra
content = content.replace(
  /<h3 className="text-lg font-semibold mb-1 text-brand-cyan">/g,
  `{!analysis ? ${emptyStateMsg} : <><h3 className="text-lg font-semibold mb-1 text-brand-cyan">`
);

content = content.replace(
  /                  \)\}\n                <\/div>\n              \)\}\n\n              \{\/\* ===== TAB 3/g,
  `                  )}\n                  </>}\n                </div>\n              )}\n\n              {/* ===== TAB 3`
);

// Tab 3: electives
content = content.replace(
  /\{\/\* Hướng dẫn \*\/\}\n                  <div className="mb-6 p-4 rounded-xl/g,
  `{!analysis ? ${emptyStateMsg} : <>{/* Hướng dẫn */}\n                  <div className="mb-6 p-4 rounded-xl`
);

content = content.replace(
  /                  <\/div>\n                <\/div>\n              \)\}\n\n              \{\/\* ===== TAB 4: FAQ/g,
  `                  </div>\n                  </>}\n                </div>\n              )}\n\n              {/* ===== TAB 4: FAQ`
);


// Because we added a generic `<div className="glass-panel overflow-hidden">`, it doesn't have `space-y-6 animate-in...` which is now only applied to Overview.
// So let's wrap the Tabs in a div with animation and margin-top if needed.
content = content.replace(
  '<div className="glass-panel overflow-hidden">',
  '<div className="glass-panel overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">'
);

fs.writeFileSync(path, content);
console.log("Success");
