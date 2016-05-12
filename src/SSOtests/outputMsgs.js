function outputMsgs(msgs, writeElement) {
    var arrayLength,
        arrayIndex,
        outMsg = "",
        consolemsg = " ";

    if (writeElement) {
	     outMsg = writeElement.innerHTML;
    }
    
    arrayLength = msgs.length;
    for (arrayIndex = 0; arrayIndex < arrayLength; arrayIndex = arrayIndex + 1) {
        outMsg = outMsg + "<br>" + msgs[arrayIndex];
        consolemsg = consolemsg + "\n" + msgs[arrayIndex];
    }
    
    if (writeElement) {
        writeElement.innerHTML = outMsg;
       // document.getElementById("theid").innerHTML=word;
        //document.write(outMsg);
     //   outMsg = htmlTarget["html"]() + msg;
       // htmlTarget["html"](outMsg);
    }
    
    
    console.log(consolemsg); 
    return consolemsg;
}

