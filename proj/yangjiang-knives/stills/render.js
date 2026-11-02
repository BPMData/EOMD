const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [f,w,h] of [['still1-phone-open',390,844],['still2-laptop-japan',1440,900],['still3-phone-plate',390,844]]){
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
await p.goto('file://'+__dirname+'/'+f+'.html');await p.waitForTimeout(300);
await p.screenshot({path:__dirname+'/'+f+'.png'});await p.close();}
await b.close();})();
