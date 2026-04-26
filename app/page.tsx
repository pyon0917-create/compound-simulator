'use client';

import Script from 'next/script';

const BODY_HTML = `
<div id="lp-tab-bar">
  <button id="tab-lifeplan" class="lp-tab lp-tab-active" onclick="lpSwitchTab('lifeplan')">ライフプラン</button>
  <button id="tab-simple"   class="lp-tab"               onclick="lpSwitchTab('simple')">シンプル複利</button>
  <button id="tab-manual"   class="lp-tab"               onclick="lpSwitchTab('manual')">📖 取扱説明書</button>
</div>
<div id="lp-content-manual" class="lp-content" style="display:none;">
  <div style="max-width:800px;margin:0 auto;padding:24px 16px;">
    <h2 style="font-size:20px;margin-bottom:20px;">📖 取扱説明書</h2>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">🏠 このシミュレーターの思想</div>
      <div class="mn-body">
        <p style="font-size:15px;font-weight:600;margin-bottom:16px;line-height:1.6;">「お金を増やすことが目的ではなく、豊かな人生を送ることが目的です。」</p>
        <p style="font-weight:600;margin-bottom:4px;">💰 家計管理が土台</p>
        <p style="margin-bottom:12px;">このシミュレーターを正しく使うには、毎月の収支を把握し、支出をコントロールできていることが必須です。</p>
        <p style="font-weight:600;margin-bottom:4px;">📈 配当金は使い切る</p>
        <p style="margin-bottom:12px;">配当金は再投資しません。受け取った配当は旅行・食事・趣味など、人生の豊かさのために使い切ることを前提としています。投資資金は給与の中から支出管理によって別途捻出します。</p>
        <p style="font-weight:600;margin-bottom:4px;">💸 余剰現金も使い切る</p>
        <p>現金が一定額（生活防衛費＋中期資金）を超えた場合、その余剰分も満足度の高い支出として使い切ります。</p>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">📊 このアプリでできること</div>
      <div class="mn-body">
        <p style="margin-bottom:12px;">3種類の資産を組み合わせた年次ライフプランのシミュレーションができます。</p>
        <table class="mn-tbl"><tr><td>📈</td><td><strong>インデックスファンド</strong></td><td>年率7%成長を想定。老後に取り崩して使う</td></tr><tr><td>🇺🇸</td><td><strong>米国高配当株ETF</strong></td><td>年率5%成長＋配当収入。配当は毎年使い切る</td></tr><tr><td>🇯🇵</td><td><strong>国内高配当株</strong></td><td>成長なし＋配当収入。安定した配当を得る</td></tr></table>
        <p style="font-weight:600;margin:12px 0 4px;">確認できること：</p>
        <ul><li>年齢ごとの総資産・現金・配当収入の推移</li><li>インデックスの取り崩し開始タイミング</li><li>学費・生活費増加などライフイベントの影響</li><li>NISA枠の使用状況と残枠</li></ul>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">📋 始める前に準備するもの</div>
      <div class="mn-body">
        <table class="mn-tbl"><tr><td><strong>年収（税引後）</strong></td><td>源泉徴収票・給与明細</td></tr><tr><td><strong>毎月の生活費</strong></td><td>家計簿・銀行明細（×12で年額に）</td></tr><tr><td><strong>現在の各資産の評価額</strong></td><td>証券口座のトップページ</td></tr><tr><td><strong>現在の年間配当収入</strong></td><td>証券口座の配当履歴・特定口座年間取引報告書</td></tr><tr><td><strong>NISA購入済み額</strong></td><td>証券口座のNISA管理画面</td></tr></table>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">🖥️ 基本の使い方</div>
      <div class="mn-body">
        <p style="font-weight:600;">STEP 1：左パネルで数値を入力する</p>
        <p style="margin-bottom:12px;">スライダーまたは数値入力欄で各項目を設定します。入力するたびにグラフと年次テーブルがリアルタイムで更新されます。</p>
        <p style="font-weight:600;">STEP 2：グラフで全体像を確認する</p>
        <p style="margin-bottom:12px;">3種類のグラフで資産の推移を確認できます。</p>
        <p style="font-weight:600;">STEP 3：年次テーブルで詳細を確認する</p>
        <p style="margin-bottom:12px;">年齢ごとの詳細データを一覧で確認。CSVダウンロードでExcelに書き出すことも可能です。</p>
        <p style="font-weight:600;">STEP 4：URLで保存・共有する</p>
        <p>「URLをコピー」ボタンで設定をURLに保存できます。次回同じURLを開くと設定が復元されます。</p>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">⚙️ 入力項目の説明</div>
      <div class="mn-body">
        <p style="font-weight:600;margin-bottom:6px;">【基本設定】</p>
        <table class="mn-tbl"><tr><td><strong>現在年齢</strong></td><td>シミュレーション開始時の自分の年齢</td></tr><tr><td><strong>給与（税引後）</strong></td><td>手取りの年収</td></tr><tr><td><strong>配偶者収入</strong></td><td>配偶者の手取り年収。いない場合は0</td></tr><tr><td><strong>退職年齢</strong></td><td>給与収入が0になる年齢</td></tr></table>
        <p style="font-weight:600;margin:12px 0 6px;">【家族設定・こどもNISA】</p>
        <p style="margin-bottom:8px;">こどもNISA（チェックボックスをONにすると有効）：子どもごとにこどもNISAを設定できます。</p>
        <table class="mn-tbl"><tr><td><strong>こどもNISA 期待年利</strong></td><td>こどもNISAをインデックスファンドとして運用する際の期待年利。デフォルト7%</td></tr><tr><td><strong>こどもNISA 年間積立額</strong></td><td>投資フェーズの各フェーズで子どもごとに入力します</td></tr></table>
        <p style="margin-top:8px;font-size:12px;">・2027年以降かつ子どもが18歳未満の期間のみ積立が有効です<br>・積立額は親の収支から支出されます（投資フェーズで入力）<br>・評価額は毎年「期待年利」で複利成長します<br>・子どもが19〜22歳（大学4年間）に学費として自動取り崩しされます（非課税）<br>・こどもNISA評価額が学費に不足する場合は現金から補います<br>・18歳以降は通常のNISA口座に移行し、残額は引き続き運用されます</p>
        <p style="font-weight:600;margin:12px 0 6px;">【生活費設定】</p>
        <table class="mn-tbl"><tr><td><strong>生活費（変化年齢前）</strong></td><td>現在の年間生活費</td></tr><tr><td><strong>生活費 変化年齢</strong></td><td>生活費が変わる年齢（例：子どもの独立）</td></tr><tr><td><strong>生活費（変化年齢〜退職）</strong></td><td>変化年齢以降の年間生活費</td></tr><tr><td><strong>退職後 生活費</strong></td><td>退職後の年間生活費</td></tr><tr><td><strong>生活費インフレ率</strong></td><td>毎年の生活費上昇率。1〜2%が一般的</td></tr></table>
        <p style="font-weight:600;margin:12px 0 6px;">【初期保有資産（口座別評価額）】</p>
        <p style="margin-bottom:8px;">口座別に現在の保有評価額を入力します。証券口座の画面を見ながらそのまま入力できます。</p>
        <table class="mn-tbl"><tr><td><strong>インデックス 評価額（NISA口座）</strong></td><td>現在NISA口座で保有しているインデックスファンドの評価額</td></tr><tr><td><strong>インデックス 評価額（特定口座）</strong></td><td>現在特定口座で保有しているインデックスファンドの評価額</td></tr><tr><td><strong>米国ETF 評価額（NISA口座）</strong></td><td>現在NISA口座で保有している米国高配当株ETFの評価額</td></tr><tr><td><strong>米国ETF 評価額（特定口座）</strong></td><td>現在特定口座で保有している米国高配当株ETFの評価額</td></tr><tr><td><strong>国内株 評価額（NISA口座）</strong></td><td>現在NISA口座で保有している国内高配当株の評価額</td></tr><tr><td><strong>国内株 評価額（特定口座）</strong></td><td>現在特定口座で保有している国内高配当株の評価額</td></tr><tr><td><strong>現金 初期値</strong></td><td>シミュレーション開始時点の現金・預金額</td></tr><tr><td><strong>米国ETF 初期配当収入</strong></td><td>現在の年間ETF配当収入の実績額。入力することで簿価利回りのズレを補正できます</td></tr><tr><td><strong>国内株 初期配当収入</strong></td><td>現在の年間国内配当収入の実績額</td></tr></table>
        <p style="font-weight:600;margin:12px 0 6px;">【投資設定】</p>
        <table class="mn-tbl"><tr><td><strong>インデックス 期待年利</strong></td><td>年間成長率。全世界株・S&amp;P500は過去平均で7〜10%程度</td></tr><tr><td><strong>米国ETF 取得時利回り</strong></td><td>購入した時点の配当利回り。SCHDは3〜4%程度</td></tr><tr><td><strong>米国ETF 増配率</strong></td><td>配当金が毎年増える割合。SCHDは過去平均10%程度</td></tr><tr><td><strong>米国ETF 値上がり率</strong></td><td>ETFの価格が毎年上昇する割合</td></tr><tr><td><strong>国内株 取得時利回り</strong></td><td>国内高配当株の取得時の配当利回り</td></tr><tr><td><strong>国内株 増配率</strong></td><td>国内株の配当増加率</td></tr><tr><td><strong>取崩し 開始評価額</strong></td><td>この金額を超えた翌年から取り崩し開始。0の場合は退職年齢から開始</td></tr><tr><td><strong>取崩し率</strong></td><td>取り崩す割合。4%ルールが一般的</td></tr><tr><td><strong>現金キャップ</strong></td><td>保有する現金の上限額。超えた分は使い切る前提</td></tr></table>
        <p style="font-weight:600;margin:12px 0 6px;">【NISA設定】</p>
        <p style="margin-bottom:8px;padding:8px 12px;background:var(--card-bg);border-radius:6px;font-size:13px;">💡 NISAとは？ 投資の利益・配当に通常約20%かかる税金が非課税になる制度です。年間360万円まで投資でき、生涯上限は1人1800万円です。</p>
        <p style="font-weight:600;margin:12px 0 6px;">【投資フェーズ】</p>
        <p style="margin-bottom:8px;">人生のステージごとに投資額と口座の振り分けを設定できます。各資産について「NISA口座への投資額」と「特定口座への投資額」を別々に入力します。</p>
        <p style="font-size:12px;">・NISA口座への入力額がNISA残枠を超えた場合、超過分は自動的に特定口座に振り替えられます<br>・国内株をはじめから特定口座で積み立てるなど、資産ごとに口座を選択できます<br>・フェーズは「＋フェーズを追加」ボタンで複数設定できます</p>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">🧮 計算ロジックの説明</div>
      <div class="mn-body">
        <p style="font-weight:600;margin-bottom:6px;">【評価額の計算】</p>
        <table class="mn-tbl"><tr><td><strong>インデックス</strong></td><td>前年評価額 × (1 + 期待年利) + 当年投資額</td></tr><tr><td><strong>米国ETF</strong></td><td>前年評価額 × (1 + 値上がり率) + 当年投資額</td></tr><tr><td><strong>国内高配当株</strong></td><td>前年評価額 + 当年投資額（価格上昇なし）</td></tr></table>
        <p style="font-weight:600;margin:12px 0 6px;">【配当収入の計算】</p>
        <table class="mn-tbl"><tr><td><strong>ETF配当</strong></td><td>前年ETF評価額 × 当年YOC ÷ 100</td></tr><tr><td><strong>国内配当</strong></td><td>前年国内評価額 × 国内YOC ÷ 100</td></tr></table>
        <p style="font-weight:600;margin:12px 0 6px;">【税金の計算】</p>
        <table class="mn-tbl"><tr><td><strong>NISA口座の配当・取崩し収入</strong></td><td>完全非課税（税金なし）</td></tr><tr><td><strong>特定口座の配当・取崩し収入</strong></td><td>約20.315%課税（所得税＋住民税＋復興特別所得税）</td></tr></table>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">🔗 設定の保存と共有</div>
      <div class="mn-body">
        <p style="font-weight:600;margin-bottom:6px;">【自動保存について】</p>
        <p style="margin-bottom:8px;">設定を変更するたびに、アドレスバーのURLが自動で最新の状態に更新されます。ブックマークしておけば、次回アクセス時に設定が自動で復元されます。保存ボタンは不要です。</p>
        <p style="font-weight:600;margin-bottom:6px;">【設定をリセットしたい場合】</p>
        <p>「設定をリセット」ボタンをクリックするとデフォルト値に戻ります。</p>
      </div>
    </div>
    <div class="mn-section">
      <div class="mn-header" onclick="this.parentElement.classList.toggle('mn-open')">❓ よくある質問（FAQ）</div>
      <div class="mn-body">
        <p style="font-weight:600;">Q. 1年目から配当金が0になる</p>
        <p style="margin-bottom:12px;">A. 「初期保有資産」の「米国ETF 初期配当収入」に現在の年間配当収入を入力してください。</p>
        <p style="font-weight:600;">Q. 配当金を再投資するシミュレーションはできますか？</p>
        <p style="margin-bottom:12px;">A. このシミュレーターは「配当金は使い切る」思想をベースに設計されているため、配当再投資には対応していません。</p>
        <p style="font-weight:600;">Q. NISAの残枠はどこで確認できますか？</p>
        <p style="margin-bottom:12px;">A. サマリーカード（グラフ上部）にNISA残枠が常時表示されています。</p>
        <p style="font-weight:600;">Q. 設定を保存したい</p>
        <p style="margin-bottom:12px;">A. 「URLをコピー」ボタンでURLを保存してください。アカウント登録は不要です。</p>
        <p style="font-weight:600;">Q. こどもNISAの積立額はどこから出ますか？</p>
        <p style="margin-bottom:12px;">A. 親の収支から支出されます。投資フェーズの各フェーズに「こどもNISA 子ども1」などの入力欄があります。</p>
      </div>
    </div>
  </div>
</div>
<div id="lp-content-lifeplan" class="lp-content" style="display:block;">
  <div id="lp-wrap">
    <div id="lp-panel"></div>
    <div id="lp-output"></div>
  </div>
</div>
<div id="lp-content-simple" class="lp-content" style="display:none;">
<div class="container">
  <div class="header">
    <h1>複利シミュレーター</h1>
    <button class="share-btn" onclick="shareResult()" title="シェア">⬆</button>
  </div>
  <div class="summary-cards">
    <div class="card">
      <div class="card-label">最終資産</div>
      <div class="card-value blue" id="card-final">—</div>
    </div>
    <div class="card">
      <div class="card-label">総投資額</div>
      <div class="card-value default" id="card-invest">—</div>
    </div>
    <div class="card">
      <div class="card-label">うち利息</div>
      <div class="card-value blue" id="card-interest">—</div>
    </div>
  </div>
  <div class="sliders">
    <div class="slider-row">
      <span class="slider-label">初期元本</span>
      <input type="range" id="sl-principal" min="0" max="50000000" step="500000" value="5000000" oninput="onSlider('principal')">
      <input type="number" class="slider-input" id="inp-principal" min="0" max="100000" step="1" value="500" oninput="onTextInput('principal')">
      <span class="slider-unit">万円</span>
    </div>
    <div class="slider-row">
      <span class="slider-label">毎月積立</span>
      <input type="range" id="sl-monthly" min="0" max="500000" step="10000" value="50000" oninput="onSlider('monthly')">
      <input type="number" class="slider-input" id="inp-monthly" min="0" max="10000" step="1" value="5" oninput="onTextInput('monthly')">
      <span class="slider-unit">万円</span>
    </div>
    <div class="slider-row">
      <span class="slider-label">年利</span>
      <input type="range" id="sl-rate" min="1" max="15" step="1" value="5" oninput="onSlider('rate')">
      <input type="number" class="slider-input" id="inp-rate" min="0.1" max="50" step="0.1" value="5" oninput="onTextInput('rate')">
      <span class="slider-unit">%</span>
    </div>
    <div class="slider-row">
      <span class="slider-label">運用年数</span>
      <input type="range" id="sl-years" min="5" max="40" step="5" value="20" oninput="onSlider('years')">
      <input type="number" class="slider-input" id="inp-years" min="1" max="50" step="1" value="20" oninput="onTextInput('years')">
      <span class="slider-unit">年</span>
    </div>
  </div>
  <div class="chart-wrap">
    <div class="chart-canvas-wrap">
      <canvas id="chart"></canvas>
    </div>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot" style="background:#8e8e93"></div>元本
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#34c759"></div>積立
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#007aff"></div>利息
      </div>
    </div>
  </div>
  <div class="rule72">
    <span class="rule72-icon">⊗</span>
    <span class="rule72-label">72の法則：</span>
    <span class="rule72-value" id="rule72-text">—</span>
  </div>
</div>
</div>
<div class="toast" id="toast">クリップボードにコピーしました</div>
`;

export default function Page() {
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          const s = document.createElement('script');
          s.src = '/app.js';
          document.head.appendChild(s);
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: BODY_HTML }} />
    </>
  );
}
