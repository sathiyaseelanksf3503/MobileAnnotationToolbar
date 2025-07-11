var printWindow = null;
var fileByteArray = [];

window.addEventListener('message', (event) => {
    if (event.data?.type === 'print-start') {
        console.log('Print event started');
    } else if (event.data?.type === 'print-end') {
        console.log('Print event ended');
    }
});

this.closePrintWindow = function () {
    if (this.printWindow && !this.printWindow.closed) {
        this.printWindow.close();
    }
};

function splitByteArray(byteArray) {
    if (byteArray) {
        if (fileByteArray) {
            let newByteArray = new Uint8Array(fileByteArray.length + byteArray.length);
            newByteArray.set(fileByteArray, 0);
            newByteArray.set(new Uint8Array(byteArray), fileByteArray.length);
            fileByteArray = newByteArray;
        }
        else {
            fileByteArray = byteArray;
        }
    }   
}

function printSameWindow(byteArray, issplit = false) {
    var blobUrl;
    if (issplit) {
        let newByteArray = new Uint8Array(this.fileByteArray.length + byteArray.length);
        newByteArray.set(this.fileByteArray, 0);
        newByteArray.set(new Uint8Array(byteArray), this.fileByteArray.length);
        this.fileByteArray = newByteArray;
        const BlobFile = new Blob([new Uint8Array(this.fileByteArray)], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(BlobFile);
    }
    else {
        const BlobFile = new Blob([new Uint8Array(byteArray)], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(BlobFile);
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.src = blobUrl;

    window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'print-start' },
        origin: window.origin
    }));

    let hasPrinted = false;

    const tryPrint = () => {
        if (hasPrinted) return;
        hasPrinted = true;

        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                window.postMessage({ type: 'print-end' }, '*');
            } else {
                throw new Error("Unable to access iframe content");
            }
        } catch (error) {
            console.error("Error while trying to print:", error);
            alert("There was an error while trying to print. Please try again.");
        }
    };

    iframe.onload = () => {
        setTimeout(tryPrint, 1000);
    };

    setTimeout(tryPrint, 3000); // Fallback

    setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(iframe);
    }, 60000);
}

// function printNewWindow(byteArray, fileName = 'document.pdf', issplit = false) {
//     var blobUrl;
//     if (issplit) {
//         let newByteArray = new Uint8Array(this.fileByteArray.length + byteArray.length);
//         newByteArray.set(this.fileByteArray, 0);
//         newByteArray.set(new Uint8Array(byteArray), this.fileByteArray.length);
//         this.fileByteArray = newByteArray;
//         const BlobFile = new Blob([new Uint8Array(this.fileByteArray)], { type: 'application/pdf' });
//         blobUrl = URL.createObjectURL(BlobFile);
//     }
//     else {
//         const BlobFile = new Blob([new Uint8Array(byteArray)], { type: 'application/pdf' });
//         blobUrl = URL.createObjectURL(BlobFile);
//     }

//     // Detect if the device is an iPad
//     const isIpad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;

//     if (isIpad) {
//         // Open PDF directly in a new tab for iPad
//         const newTab = window.open(blobUrl, '_blank');
//         if (!newTab) {
//             alert("Please allow pop-ups for this site.");
//             return;
//         }
//     } else {
//         const screenWidth = window.screen.availWidth;
//         const screenHeight = window.screen.availHeight;

//         const printWindow = window.open('', fileName, `width=${screenWidth},height=${screenHeight},top=0,left=0,toolbar=no,menubar=no,scrollbars=no,resizable=no`);

//         if (!printWindow) {
//             alert("Please allow pop-ups for this site.");
//             return;
//         }

//         const htmlContent = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <title>${fileName}</title>
//                 <style>
//                     html, body {
//                         margin: 0;
//                         padding: 0;
//                         height: 100%;
//                         overflow: hidden;
//                     }
//                     iframe {
//                         width: 100%;
//                         height: 100%;
//                         border: none;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <iframe id="pdfFrame" src="${blobUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0"></iframe>
//                 <script>
//                     const iframe = document.getElementById('pdfFrame');
//                     iframe.onload = function () {
//                         setTimeout(() => {
//                             iframe.contentWindow.focus();
//                             iframe.contentWindow.print();
//                         }, 500);
//                     };

//                     // Notify parent when printing is done
//                     window.onafterprint = function () {
//                         window.close();
//                     };
//                 </script>
//             </body>
//             </html>
//         `;

//         printWindow.document.open();
//         printWindow.document.write(htmlContent);
//         printWindow.document.close();

//         setTimeout(() => {
//             URL.revokeObjectURL(blobUrl);
//         }, 60000);
//     }
// }
function printNewWindow(byteArray, fileName = 'document.pdf', issplit = false) {
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    // Create object URL
    const blobUrl = URL.createObjectURL(blob);

    // Open new window with the blob URL
    const printWindow = window.open(blobUrl, '_blank');

    if (!printWindow) {
        alert("Failed to open the PDF. Please allow pop-ups for this site.");
        return;
    }

    const tryPrint = () => {
        printWindow.focus();
        printWindow.print();
    };

    // Try printing on load event (works in Chrome and Edge)
    printWindow.addEventListener('load', tryPrint);

    // Fallback for Firefox: try printing after a delay
    setTimeout(tryPrint, 3000);

    // Clean up the object URL after a delay
    setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
    }, 60000); // Clean up after 1 minute
}