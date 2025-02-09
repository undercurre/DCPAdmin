<template>
  <div class="card" style="height: 100%">
    <div class="flex items-center justify-between px-10px">
      <h3>试题管理</h3>
      <el-button type="primary" @click="dialogVisible = true">题目录入</el-button>
    </div>
    <el-table :data="tableData" style="width: 100%; height: 100%">
      <el-table-column prop="content" label="题目" width="240" />
      <el-table-column prop="standard" label="答案" width="120" />
      <el-table-column prop="createdAt" label="CreateTime" width="320" />
      <el-table-column :fixed="false" label="ToDo" min-width="120">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="go2Answer(scope.row.id)">刷它</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" title="题目录入" width="1000" :before-close="handleClose">
      <el-form :model="form" label-width="auto" style="max-width: 1000px">
        <el-form-item label="题目">
          <el-input type="textarea" autosize resize="none" v-model="form.content" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input type="textarea" autosize resize="none" v-model="form.standard" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="uploadData"> Confirm </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeMount, reactive, ref } from "vue";

import { ElMessage, ElMessageBox, ElTable } from "element-plus";
import { createQuestion, getQuestionList } from "@/api/modules/study";
import { Study } from "@/api/interface/study";
import router from "@/routers";

let tableData = ref<Array<Study.Question>>([]);

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

let form = reactive({
  content: "",
  standard: ""
});

const resetForm = () => {
  form = reactive({
    content: "",
    standard: ""
  });
};

async function uploadData() {
  const res = await createQuestion({ content: form.content, standard: form.standard });
  if (res.code === 200) {
    ElMessage.success("成功");
    dialogVisible.value = false;
    getQuestionList();
    resetForm();
  } else {
    ElMessage.success("失败");
  }
}

const go2Answer = (id: string) => {
  router.push({ path: "/study/answer", query: { id } });
};

onBeforeMount(async () => {
  const listRes = await getQuestionList();

  console.log(listRes.data);

  tableData.value = listRes.data;
});
</script>
