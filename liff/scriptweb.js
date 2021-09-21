const modalWrapper = document.querySelector(".modal-wrapper");
// modal add
const addModal = document.querySelector(".add-modal");
const addModalForm = document.querySelector(".add-modal .form");

// modal edit
const editModal = document.querySelector(".edit-modal");
const editModalForm = document.querySelector(".edit-modal .form");

const btnAdd = document.querySelector(".btn-add");

const tableUsers = document.querySelector(".table-users");

let id;

// Create element and render users
const renderUser = (doc) => {
  //alert(doc.data().name);
  if (doc.data().status != "") {
    const tr = `
    <tr data-id='${doc.id}'>
      <td>${doc.data().num} <br> ${doc.data().type} ใบ</td>
      <td>${doc.data().price}</td>
      <td>${doc.data().name} <br> ${doc.data().time} <br> ${
      doc.data().remark
    }</td>
            <td>${doc.data().status}</td>
      <td>
        
      </td>
    </tr>
  `;

    tableUsers.insertAdjacentHTML("beforeend", tr);
  } else {
    const tr = `
    <tr data-id='${doc.id}'>
      <td>${doc.data().num} <br> ${doc.data().type} ใบ</td>
      <td>${doc.data().price}</td>
      <td>${doc.data().name} <br> ${doc.data().time} <br> ${
      doc.data().remark
    }</td>
            <td>${doc.data().status}</td>
      <td>
        <button class="btn btn-edit">แก้ไข</button></button>
        <button class="btn btn-delete" >ลบ</button>
      </td>
    </tr>
  `;

    tableUsers.insertAdjacentHTML("beforeend", tr);

    // Click edit user
    const btnEdit = document.querySelector(`[data-id='${doc.id}'] .btn-edit`);
    btnEdit.addEventListener("click", () => {
      editModal.classList.add("modal-show");

      var d = new Date();
      var n = d.toLocaleString("th-TH", { timeZone: "Asia/Jakarta" });

      id = doc.id;
      editModalForm.enum.value = doc.data().num;
      //editModalForm.ename.value = doc.data().name;
      editModalForm.eremark.value = doc.data().remark;
      editModalForm.estatus.value = doc.data().status;
      editModalForm.etime.value = n;
    });

    // Click delete user
    const btnDelete = document.querySelector(
      `[data-id='${doc.id}'] .btn-delete`
    );
    btnDelete.addEventListener("click", () => {
      db.collection("lotto")
        .doc(`${doc.id}`)
        .delete()
        .then(() => {
          alert("succesfully deleted!");
          console.log("Document succesfully deleted!");
        })
        .catch((err) => {
          console.log("Error removing document", err);
        });
    });
  }
};





// Click add user button
btnAdd.addEventListener("click", () => {
  addModal.classList.add("modal-show");

  addModalForm.num.value = "";
  addModalForm.type.value = "";
  addModalForm.DrawDate.value = "";
  addModalForm.price.value = "";
});

// User click anyware outside the modal
window.addEventListener("click", (e) => {
  if (e.target === addModal) {
    addModal.classList.remove("modal-show");
  }
  if (e.target === editModal) {
    editModal.classList.remove("modal-show");
  }
});

// Get all users
// db.collection('users').get().then(querySnapshot => {
//   querySnapshot.forEach(doc => {
//     renderUser(doc);
//   })
// });

// Real time listener
db.collection("lotto")
  .orderBy("num")
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        renderUser(change.doc);
      }
      if (change.type === "removed") {
        let tr = document.querySelector(`[data-id='${change.doc.id}']`);
        let tbody = tr.parentElement;
        tableUsers.removeChild(tbody);
      }
      if (change.type === "modified") {
        let tr = document.querySelector(`[data-id='${change.doc.id}']`);
        let tbody = tr.parentElement;
        tableUsers.removeChild(tbody);
        renderUser(change.doc);
      }
    });
  });

// Click submit in add modal
addModalForm.addEventListener("submit", (e) => {
        var d = new Date();
        var n = d.toLocaleString("th-TH", { timeZone: "Asia/Jakarta" });

  e.preventDefault();
  db.collection("lotto").add({
    num: addModalForm.num.value,
    type: addModalForm.type.value,
    DrawDate: addModalForm.DrawDate.value,
    price: addModalForm.price.value,
    name: addModalForm.name.value,
    remark: addModalForm.remark.value,
    status: addModalForm.status.value,
    time: n,
  });
  modalWrapper.classList.remove("modal-show");
});

// Click submit in edit modal
editModalForm.addEventListener("submit", (e) => {
  alert("แก้ไขเรียบร้อย");
          var d = new Date();
          var n = d.toLocaleString("th-TH", { timeZone: "Asia/Jakarta" });
  e.preventDefault();
  db.collection("lotto").doc(id).update({
    num: editModalForm.enum.value,
    type: editModalForm.etype.value,
    name: editModalForm.ename.value,
    remark: editModalForm.eremark.value,
    time: n,
  });
  editModal.classList.remove("modal-show");
  //window.location.reload();
});
