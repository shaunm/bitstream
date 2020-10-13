const BASE_URL = "https://bitsend.herokuapp.com/"
$(document).ready(function() {
    let typed = new Typed('.title', {
        strings: ["Your personal file courier service"],
        typeSpeed: 40
    });
    $('form input').change(function() {
        $('form p').text(this.files[0].name + " selected");
    });
});

function upload(){
    let file = document.getElementById("files").files[0];
    getBase64(file).then( async (data) => {
        try{
            const rawResponse = await fetch(BASE_URL + "store", {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({data})
            });
            const contentId = await rawResponse.json().success;
        }
        catch(e){
            console.error(e);
            alert(e);
        }
        console.log(`ID: ${contentId}`);
        let accessUrl = `${window.location.href}#${contentId}`;
        let copyHTML =  `
            <input id="foo" value="${accessUrl}">
            <button class="btn" data-clipboard-target="#foo">
                <img src="https://clipboardjs.com/assets/images/clippy.svg" alt="Copy to clipboard">
            </button>
        `;
        $("#bitstream").html(copyHTML);
        alert(`You have 5 minutes to visit the following link in your browser: \n${accessUrl}`);

    });
}

async function getFile(fileID){
    try{
        const rawResponse = await fetch(BASE_URL + `get/${fileID}`);
        const content = await rawResponse.json()
    }
    catch(e){
        console.error(e);
        alert(e);
    }
    let data = content.data;
    window.open(data);
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

if(window.location.hash) {
    let hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
    if (hash.length != 8){
        alert(`We detected a request to get the following id: ${hash}, but it seems like there was a typo.`);
    }
    else{
        getFile(hash);
    }
    // hash found
} else {
    // No hash found
}