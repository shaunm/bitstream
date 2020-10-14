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

async function upload(){
    let file = document.getElementById("files").files[0];
    let b64, contentId;
    try {
        b64 = await getBase64(file);
    }
    catch(e){
        console.log(e);
    }
    try {

        contentId = await fetch(BASE_URL + "store", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': "text/plain"
            },
            body: b64
        });
        contentId = await contentId.json();

    }
    catch(e){
        console.log(e);
    }
    console.log(contentId);
    contentId = contentId.success;
    if (contentId != null){
        let accessUrl = `${window.location.href}#${contentId}`;
        let copyHTML =  `
                    <div class="input-group" style=" margin: 15vh 0px; width: 100%; ">
                        <input style="margin-right: 40px;width: 50%;" id="foo" value="${accessUrl}">
                        <button class="btn" type="button" data-clipboard-demo="" data-clipboard-target="#foo">
                            Copy
                        </button> 
                    </div>

                 `;
        $("#bitstream").html(copyHTML);
        alert(`You have 5 minutes to visit the following link in your browser: \n${accessUrl}`);


    }

}

async function getFile(fileID){
    let content;
    try{
        const rawResponse = await fetch(BASE_URL + `get/${fileID}`);
        content = await rawResponse.json();
        let data = content.data;
        document.getElementById('content-frame').src = data;
        $("#content-frame").show();
        $("main").hide();

    }
    catch(e){
        console.error(e);
        alert(e);
    }

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