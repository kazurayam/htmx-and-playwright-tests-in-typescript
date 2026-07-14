// static/sweetalert/custom-dialog.js

htmx.on("htmx:confirm", function (e) {
    const element = e.detail.elt;
    if (!element.hasAttribute('hx-confirm')) return;

    e.preventDefault();

    Swal.fire({
        title: "削除の確認",
        text: element.getAttribute('hx-confirm')
    }).then(function (result) {
        if (result.isConfirmed) {
            e.detail.issueRequest(true);
        }
    });
})
