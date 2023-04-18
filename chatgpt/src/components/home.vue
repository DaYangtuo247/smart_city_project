<template>
	<div class="flex flex-col h-screen">
		<div
			class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100"
		>
			<div class="text-2xl font-bold">UrbanGPT</div>
			<div class="ml-4 text-sm text-gray-500">
				基于 gpt-3.5-turbo 自然语言模型的智能城市助手
			</div>
			<!-- <div
				class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md"
				@click="clickConfig()"
			>
				设置
			</div> -->
		</div>

		<div class="flex-1 mx-2 mt-20 mb-2" ref="chatListDom">
			<div
				class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg"
				v-for="item of messageList.filter((v) => v.role !== 'system')"
			>
				<div class="flex justify-between items-center mb-2">
					<div class="font-bold">{{ roleAlias[item.role] }}：</div>
					<Copy
						class="invisible group-hover:visible"
						:content="item.content"
					/>
				</div>
				<div>
					<div
						class="prose text-sm text-slate-600 leading-relaxed"
						v-if="item.content"
						v-html="md.render(item.content)"
					></div>
					<Loding v-else />
				</div>
			</div>
		</div>

		<div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
			<div class="-mt-2 mb-2 text-sm text-gray-500" v-if="isConfig">
				请输入 API Key：
			</div>
			<div class="flex">
				<input
					class="input"
					:type="isConfig ? 'password' : 'text'"
					:placeholder="isConfig ? 'sk-xxxxxxxxxx' : '请输入'"
					v-model="messageContent"
					@keydown.enter="isTalking || sendOrSave()"
				/>
				<button class="btn" :disabled="isTalking" @click="sendOrSave()">
					{{ isConfig ? "保存" : "发送" }}
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ChatMessage } from "@/types";
import { ref, watch, nextTick, onMounted } from "vue";
import { chat } from "@/libs/gpt";
import cryptoJS from "crypto-js";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import { md } from "@/libs/markdown";

let apiKey = "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";
let isConfig = ref(true);
let isTalking = ref(false);
let messageContent = ref("");
const chatListDom = ref<HTMLDivElement>();
const decoder = new TextDecoder("utf-8");
const roleAlias = { user: "ME", assistant: "ChatGPT", system: "System" };
const messageList = ref<ChatMessage[]>([
	{
		role: "system",
		content: "你是一个智慧城市助手，你需要根据你的数据库中的信息，为武汉市的城市治理提供一些建议，并提供一些武汉市的数据信息",
	},
	{
		role: "assistant",
		content: `你好，我是基于gpt-3.5-turbo大语言模型的智慧城市助手，我可以提供一些常用服务和信息，例如：

1. 交通状况简述：我可以把当前的交通状况做一个简要的汇报。

2. 城市现状分析：我可以根据当前城市数据，为城市现状进行简要总结、并为城市治理提供一些建议。

3. 城市信息模型（CIM）系统介绍：我可以向你提供依赖CIM构建的本系统的一些技术信息。

请告诉我你需要哪方面的帮助，我会根据你的需求给你提供相应的信息和建议。`,
	},
]);

onMounted(() => {
	if (getAPIKey()) {
		switchConfigStatus();
	}
});

const sendChatMessage = async (content: string = messageContent.value) => {
	try {
		isTalking.value = true;
		if (messageList.value.length === 2) {
			messageList.value.pop();
		}
		messageList.value.push({ role: "user", content });
		clearMessageContent();
		messageList.value.push({ role: "assistant", content: "" });

		const { body, status } = await chat(messageList.value, getAPIKey());
		if (body) {
			const reader = body.getReader();
			await readStream(reader, status);
		}
	} catch (error: any) {
		appendLastMessageContent(error);
	} finally {
		isTalking.value = false;
	}
};

const readStream = async (
	reader: ReadableStreamDefaultReader<Uint8Array>,
	status: number
) => {
	let partialLine = "";

	while (true) {
		// eslint-disable-next-line no-await-in-loop
		const { value, done } = await reader.read();
		if (done) break;

		const decodedText = decoder.decode(value, { stream: true });

		if (status !== 200) {
			const json = JSON.parse(decodedText); // start with "data: "
			const content = json.error.message ?? decodedText;
			appendLastMessageContent(content);
			return;
		}

		const chunk = partialLine + decodedText;
		const newLines = chunk.split(/\r?\n/);

		partialLine = newLines.pop() ?? "";

		for (const line of newLines) {
			if (line.length === 0) continue; // ignore empty message
			if (line.startsWith(":")) continue; // ignore sse comment message
			if (line === "data: [DONE]") return; //

			const json = JSON.parse(line.substring(6)); // start with "data: "
			const content =
				status === 200
					? json.choices[0].delta.content ?? ""
					: json.error.message;
			appendLastMessageContent(content);
		}
	}
};

const appendLastMessageContent = (content: string) =>
	(messageList.value[messageList.value.length - 1].content += content);

const sendOrSave = () => {
	if (!messageContent.value.length) return;
	if (isConfig.value) {
		if (saveAPIKey(messageContent.value.trim())) {
			switchConfigStatus();
		}
		clearMessageContent();
	} else {
		sendChatMessage();
	}
};

const clickConfig = () => {
	if (!isConfig.value) {
		messageContent.value = getAPIKey();
	} else {
		clearMessageContent();
	}
	switchConfigStatus();
};

const getSecretKey = () => "lianginx";

const saveAPIKey = (apiKey: string) => {
	if (apiKey.slice(0, 3) !== "sk-" || apiKey.length !== 51) {
		alert("API Key 错误，请检查后重新输入！");
		return false;
	}
	const aesAPIKey = cryptoJS.AES.encrypt(apiKey, getSecretKey()).toString();
	localStorage.setItem("apiKey", aesAPIKey);
	return true;
};

const getAPIKey = () => {
	if (apiKey) return apiKey;
	const aesAPIKey = localStorage.getItem("apiKey") ?? "";
	apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey()).toString(
		cryptoJS.enc.Utf8
	);
	return apiKey;
};

const switchConfigStatus = () => (isConfig.value = !isConfig.value);

const clearMessageContent = () => (messageContent.value = "");

const scrollToBottom = () => {
	if (!chatListDom.value) return;
	scrollTo(0, chatListDom.value.scrollHeight);
};

watch(messageList.value, () => nextTick(() => scrollToBottom()));
</script>

<style scoped>
pre {
	font-family: -apple-system, "Noto Sans", "Helvetica Neue", Helvetica,
		"Nimbus Sans L", Arial, "Liberation Sans", "PingFang SC",
		"Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC",
		"Source Han Sans CN", "Microsoft YaHei", "Wenquanyi Micro Hei",
		"WenQuanYi Zen Hei", "ST Heiti", SimHei, "WenQuanYi Zen Hei Sharp",
		sans-serif;
}
</style>
