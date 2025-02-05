<template>
  <div class="card" style="height: 100%">
    <div class="flex items-center justify-between px-10px">
      <h3>账单管理</h3>
      <el-button type="primary" @click="dialogVisible = true">数据导入</el-button>
    </div>
    <el-table :data="tableData" class="flex-1">
      <el-table-column fixed prop="amount" label="Amount" width="120" />
      <el-table-column prop="category" label="Category" width="120" />
      <el-table-column prop="description" label="Description" width="240" />
      <el-table-column prop="expenseDate" label="ExpenseDate" width="320" />
      <el-table-column prop="createdAt" label="CreatedAt" width="320" />
      <!-- <el-table-column :fixed="false" prop="updated_at" label="ToDo" min-width="120">
        <template #default>
          <el-button link type="primary" size="small"> Detail </el-button>
          <el-button link type="primary" size="small">Edit</el-button>
        </template>
      </el-table-column> -->
    </el-table>

    <el-dialog v-model="dialogVisible" title="数据导入" width="500" :before-close="handleClose">
      <el-upload
        ref="upload"
        class="upload-demo"
        v-model:file-list="fileList"
        drag
        :auto-upload="false"
        :limit="1"
        :on-exceed="handleExceed"
        :on-change="onChange"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
        <template #tip>
          <div class="el-upload__tip">上传微信账单csv文件</div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="dialogVisible = false"> Confirm </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, ref } from "vue";

import { ElMessageBox, ElTable, genFileId, UploadFile, UploadInstance, UploadProps, UploadRawFile } from "element-plus";
import { createBatchBill, getBillList } from "@/api/modules/bill";
import { Bill } from "@/api/interface/bill";

let tableData = ref<Array<Bill.Entity>>([]);

const dialogVisible = ref(false);

const handleClose = (done: () => void) => {
  ElMessageBox.confirm("Are you sure to close this dialog?")
    .then(() => {
      done();
    })
    .catch(() => {
      // catch error
    });
};

const fileList = ref<UploadFile[]>([]);
let csvParsed: string[][] = [];

const upload = ref<UploadInstance>();

const handleExceed: UploadProps["onExceed"] = files => {
  upload.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  upload.value!.handleStart(file);
};

async function onChange(file: UploadFile) {
  if (!file.raw) return;
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const data = e.target?.result;
    handleCSVFile(data);
  };
  reader.readAsText(file.raw);
  return true;
}

// '交易时间', '交易类型', '交易对方', '商品', '收/支', '金额(元)', '支付方式', '当前状态', '交易单号', '商户单号', '备注\r'
type WechatBill = {
  transactionTime: string; // 交易时间
  transactionType: string; // 交易类型
  counterparty: string; // 交易对方
  product: string; // 商品
  incomeOrExpense: string; // 收/支
  amount: number; // 金额(元)
  paymentMethod: string; // 支付方式
  currentStatus: string; // 当前状态
  transactionId: string; // 交易单号
  merchantOrderId: string; // 商户单号
  remarks: string; // 备注
};

async function handleCSVFile(data: string | ArrayBuffer | null | undefined) {
  if (data && typeof data === "string") {
    const lines = data.split("\n");
    lines[0].split(",");
    csvParsed = lines.slice(1).map(line => line.split(","));
    const mappedData = handleWechatBill(csvParsed);
    // 映射成数据库入库数据
    const outData: Omit<Bill.Entity, "id" | "createdAt">[] = mappedData.map((item: WechatBill) => {
      return {
        amount: item.amount,
        category: item.incomeOrExpense,
        description: item.counterparty + item.product,
        expenseDate: item.transactionTime
      };
    });
    await createBatchBill(outData);
  }
}

function handleWechatBill(csvParsed: string[][]): Array<WechatBill> {
  // 舍弃前15行数据
  const abandoned = csvParsed.slice(16, -1);
  // 映射转化为对象
  const mapped = abandoned.map(item => {
    return {
      transactionTime: item[0],
      transactionType: item[1],
      counterparty: item[2],
      product: item[3],
      incomeOrExpense: item[4],
      amount: Number(item[5].slice(1)),
      paymentMethod: item[6],
      currentStatus: item[7],
      transactionId: item[8],
      merchantOrderId: item[9],
      remarks: item[10]
    };
  });
  return mapped;
}

onBeforeMount(async () => {
  const listRes = await getBillList();

  console.log(listRes.data);

  tableData.value = listRes.data;
});

/* sheetjs+vue+element-plus运用记录
    1. 下载xlsx包
    2. 使用change钩子
    3. 使用fileReader进行文件二进制数据解析
    4. 使用XLSX.read解析成workbook

  File和Blob的关系和区别

  1.File是Blob的子类
  2.File是文件的JS对象，Blob是二进制数据本身

  csv本身可以直接通过fileReader解析成text
*/
</script>
