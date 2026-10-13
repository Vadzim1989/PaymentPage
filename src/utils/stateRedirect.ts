import { eventBusDispatcher } from "@/utils/eventBusDispatcher";

let delay = 1000,
  skipRepeatCreate = false;

export function redirectToPostForm(response) {
  checkPostParams(response, () => {
    const form = createForm(response.url);
    attachInput(response.post, form);
    document.body.appendChild(form);
    const postForm = document.getElementById("postForm") as HTMLFormElement;
    if (postForm) {
      postForm.submit();
    } else {
      console.error("Form with id 'postForm' not found");
    }
  });
}

export function redirectToIframe(response, fetchCheckPaymentState) {
  // 4444995302336000 - карта для проверки state: iframe
  const isSizedIframe = response.iframeMode === "SIZED";
  checkPostParams(response, () => {
    const { iframeMounted, hideLoaders } = eventBusDispatcher;
    const container = document.getElementById("acs");
    if (!container) {
      console.error("Container with id 'acs' not found");
      hideLoaders();
      return;
    }
    let iframe;
    if (skipRepeatCreate && !isSizedIframe) {
      setTimeout(async () => {
        await fetchCheckPaymentState();
      }, delay);
    } else {
      iframe = createIframe(response);
      container.appendChild(iframe);
      if (isSizedIframe) {
        iframe.onload = async () => {
          try {
            iframeMounted();
            if (
              iframe.contentWindow.location.href.includes(
                window.location.origin
              )
            ) {
              container.removeChild(iframe);
              await fetchCheckPaymentState();
              hideLoaders();
            }
          // eslint-disable-next-line
          } catch (e) {
            hideLoaders();
          }
        };
      } else {
        setTimeout(async () => {
          skipRepeatCreate = true;
          delay = 4500;
          await fetchCheckPaymentState();
        }, delay);
      }
      const form = createForm(response.url);
      attachInput(response.post, form);
      iframe.appendChild(form);

      const iframeDocument =
        iframe.contentWindow.document || iframe.contentDocument;
      iframeDocument.body.appendChild(form);
      iframeDocument.getElementById("postForm").submit();
    }
  });
}

function createIframe(data) {
  const iframe = document.createElement("iframe");
  const { noSizeIframe } = window.settings;

  iframe.setAttribute("frameborder", "0");
  iframe.width = noSizeIframe ? "100%" : data.iframeWidth || "100%";
  iframe.height = noSizeIframe ? "100%" : data.iframeHeight || "100%";
  iframe.style.backgroundColor = "#fff";
  iframe.style.opacity = String(Number(data.iframeMode !== "HIDDEN"));
  iframe.style.zIndex = data.iframeMode === "HIDDEN" ? "-1" : "1";

  if (!data.iframeWidth && !data.iframeHeight) {
    iframe.style.position = "absolute";
    iframe.style.top = "0";
    iframe.style.left = "0";
  }
  return iframe;
}

function createForm(url) {
  const form = document.createElement("form");
  form.id = "postForm";
  form.action = url;
  form.method = "POST";
  form.target = "_self";

  const submit = document.createElement("input");
  submit.setAttribute("type", "submit");
  submit.style.display = "none";

  form.appendChild(submit);
  return form;
}

function attachInput(postParams, form) {
  Object.keys(postParams).forEach((key) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = postParams[key];
    form.appendChild(input);
  });
}

function checkPostParams(response, callback) {
  if (response.post) {
    callback();
  } else {
    window.location.href = response.url;
  }
}
