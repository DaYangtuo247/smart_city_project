<template>
	<div class="flex flex-col dark:bg-dark_bg">
		<div
			class="flex flex-nowrap fixed w-full items-baseline top-0 px-6 py-4 bg-gray-100 dark:bg-dark_bg_nav"
			style="height: 74px"
		>
			<div class="text-2xl font-bold dark:text-dark_text_title1_color">
				UrbanGPT
			</div>
			<div
				class="ml-4 text-sm text-gray-500 dark:text-dark_text_title2_color"
			>
				基于 gpt-3.5-turbo 的智能城市助手
			</div>
			<!-- <div
				class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md"
				@click="clickConfig()"
			>
				设置
			</div> -->
		</div>

		<div
			class="flex-1 mx-2 mt-20 mb-2"
			ref="chatListDom"
			style="min-height: 75.3vh"
		>
			<div
				class="group flex flex-col px-4 py-3 hover:bg-slate-100 dark:hover:bg-dark_content_hover rounded-lg"
				v-for="item of messageList.filter((v) => v.role !== 'system')"
			>
				<div class="flex justify-between items-center mb-2">
					<div
						class="font-bold dark:text-dark_text_reply_titile_color"
					>
						{{ roleAlias[item.role] }}：
					</div>
					<Copy
						class="invisible group-hover:visible"
						:content="item.content"
					/>
				</div>
				<div>
					<div
						class="prose text-sm text-slate-600 leading-relaxed dark:text-dark_content"
						v-if="item.content"
						v-html="md.render(item.content)"
					></div>
					<Loding v-else />
				</div>
			</div>
		</div>

		<div
			class="sticky bottom-0 w-full p-6 pb-5 bg-gray-100 dark:bg-dark_bg_nav"
		>
			<!-- <div class="-mt-2 mb-2 text-sm text-gray-500" v-if="isConfig">
				请输入 API Key：
			</div> -->
			<div class="flex">
				<input
					class="input dark:bg-dark_bg_input dark:border-dark_bg_input_border dark:text-dark_bg_input_color"
					:type="isConfig ? 'password' : 'text'"
					:placeholder="isConfig ? 'sk-xxxxxxxxxx' : '请输入'"
					v-model="messageContent"
					@keydown.enter="isTalking || sendOrSave()"
					style="font-size: 14px"
				/>
				<button class="btn" :disabled="isTalking" @click="sendOrSave()">
					<svg
						t="1687841235771"
						class="icon"
						viewBox="0 0 1045 1024"
						version="1.1"
						xmlns="http://www.w3.org/2000/svg"
						p-id="4087"
						width="25"
						height="25"
					>
						<path
							d="M989.184 87.530667c30.421333-10.154667 60.736 15.637333 55.594667 47.296l-128 789.333333a42.666667 42.666667 0 0 1-63.082667 30.336l-340.736-192.213333-154.837333 66.282666a42.666667 42.666667 0 0 1-59.349334-36.181333L298.666667 789.269333l0.256-147.733333-277.226667-156.373333c-31.168-17.6-27.882667-62.890667 4.181333-76.394667l3.306667-1.237333z m-39.936 103.232L147.349333 458.069333l215.253334 121.408a42.666667 42.666667 0 0 1 21.546666 33.706667l0.149334 3.541333-0.192 107.882667 114.666666-49.066667a42.666667 42.666667 0 0 1 34.218667 0.277334l3.541333 1.792 305.792 172.501333 106.922667-659.349333z m-127.146667 123.264a42.666667 42.666667 0 0 1-2.858666 57.728l-2.602667 2.346666-256 213.333334a42.666667 42.666667 0 0 1-57.216-63.189334l2.602667-2.346666 256-213.333334a42.666667 42.666667 0 0 1 60.074666 5.461334z"
							fill="#ffffff"
							p-id="4088"
						></path>
					</svg>
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
const roleAlias = { user: "ME", assistant: "UrbanGPT", system: "System" };
let AiTheme = "dark";
const messageList = ref<ChatMessage[]>([
	{
		role: "system",
		content:
			"你是一个智慧城市助手，你需要根据你的数据库中的信息，为武汉市的城市治理提供一些建议，并提供一些武汉市的数据信息。我将传递给你一些数据，如果我的询问中有涉及到这些数据相关的关键词，你直接回答即可：武汉轻工大学图书馆的人流量总体总体上2月、7月、8月较少，这应该是寒暑假期所致，6月、12月较多，这应该是考试月所致；永旺梦乐城在周一至周五青少年、年轻人和中年人人流量较少，应该是此时正处于工作日，老年人较多，应该是老年人趁工作日人少来此购物，而儿童一周内没有发生特别大的波动，可能是工作日期间老年人带儿童前来游玩，而周末则是中年人带儿童前来游玩所致。",
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
