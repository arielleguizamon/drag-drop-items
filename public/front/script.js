const BASE_URL = "http://localhost";
new Sortable(list, {
  animation: 150,
  onEnd: async evt => {
    // Get id from item
    if (evt.newIndex === evt.oldIndex) return;
    // if we are doing a drag and drop to the top
    if (evt.oldIndex > evt.newIndex)
      await updatePositions(evt.newIndex, evt.oldIndex - 1, "add");
    // if we are doing a drag and drop to the bottom
    else if (evt.oldIndex < evt.newIndex)
      await updatePositions(evt.oldIndex + 1, evt.newIndex, "rest");

    await updateItemPosition(evt.item.id, evt.newIndex);
  }
});

const updatePositions = async (from, to, type) => {
  const response = await fetch(`${BASE_URL}/api/items/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, type })
  });
};

const updateItemPosition = async (id, position) => {
  const response = await fetch(`${BASE_URL}/api/items/${id}/position`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ position })
  });
};

const setLength = length =>
  (document.getElementById("count").textContent = length);

const deleteItem = async id => {
  document.getElementById(id).remove();
  const response = await fetch(`${BASE_URL}/api/items/${id}`, {
    method: "DELETE"
  });
  const length = document.getElementById("count").textContent -1 ;
  setLength(length);
};
const openModal = id => {
  $("#modal").modal();
  if (id) {
    const description = $(`#description-${id}`).text();
    $("#description").val(description);
    $("#id").val(id);
    $("#file").val("");
  } else {
    $("#description").val("");
    $("#file").val("");
    $("#id").val(undefined);
  }
};

$("#form").submit(event => {
  event.preventDefault();

  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const id = $("#id").val();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", $("#description").val());
  if (id) updateItem(id, formData);
  else createItem(formData);
});

const updateItem = async (id, formData) => {
  const response = await fetch(`${BASE_URL}/api/items/${id}`, {
    method: "PUT",
    body: formData
  });
  if (response.status >= 400 && response.status < 600)
    alert(
      "There was an error creating the item, make sure you are uploading an image"
    );
  else {
    const item = await response.json();
    $(`#description-${item._id}`).text(item.description);
    document.getElementById(`img-${item._id}`).src = `/img/${item.file}`;
    $("#modal").modal("hide");
  }
};

const createItem = async formData => {
  const response = await fetch(`${BASE_URL}/api/items`, {
    method: "POST",
    body: formData
  });
  if (response.status >= 400 && response.status < 600)
    alert(
      "There was an error creating the item, make sure you are uploading an image"
    );
  else {
    const item = await response.json();
    createAndInsertItem(item);
    $("#modal").modal("hide");
    setLength(item.position + 1);
  }
};

const createAndInsertItem = item => {
  const newItemHtml = newItem(item);
  const list = document.getElementById("list");
  list.insertAdjacentHTML("beforeend", newItemHtml);
};

const newItem = item =>
  `<div class="list-group-item" id="${item._id}">
    <img id="img-${item._id}" src="/img/${item.file}" height="80px" width="80px"/>
    <span onclick="openModal('${item._id}')" id="description-${item._id}">
    ${item.description}
    </span>
    <span class="icons">
      <i class="far fa-edit" onclick="openModal('${item._id}')"></i>
      <i class="far fa-trash-alt" onclick="deleteItem('${item._id}')"></i>
    </span>
  </div>`;

const getItems = async () => {
  const response = await fetch(`${BASE_URL}/api/items`);
  const items = await response.json();
  setLength(items.length);
  items.forEach(e => {
    createAndInsertItem(e);
  });
};

getItems();
// setLength();
