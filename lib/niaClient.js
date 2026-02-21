export async function embedText(text) {
  if (!process.env.NIA_API_KEY) {
    console.warn("Nia key missing — using stub embeddings");
    return fakeEmbedding(text);
  }

  // real Nia call goes here later
}

function fakeEmbedding(text) {
  return Array(1536).fill(0).map(() => Math.random());
}


//since nia not there rest of the pipeline calls
// await embedText(content);