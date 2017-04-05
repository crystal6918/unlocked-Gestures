(function() {
	window.Lock = function() {
		this.path = []; //解锁路径
		this.cachePath = []; //临时存储路径
		this.startDraw = false; //是否开始绘制解锁图案
		this.r = 0; //半径
		this.pos = []; //各个圆心的位置

	};

	//初始化
	Lock.prototype.init = function() {
		this.initDom();		
		this.canvas = document.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.createGraph();
		this.addEvent();
	};

	//初始化界面
	Lock.prototype.initDom = function() {
		var container = document.getElementById('container');
		var htmlStr = '<canvas id="canvas" width="300" height="300"></canvas>';
		htmlStr += '<div id="tip">请输入手势密码</div>'
		htmlStr += '<label for="setLock"><input type="radio" id="setLock" value="setLock" name="lock" checked>设置密码</label>' +
			'<label for="checkLock"><input type="radio" id="checkLock" value="checkLock" name="lock">验证密码</label>';
		container.innerHTML = htmlStr;
	}
	//创建解锁图形面板
	Lock.prototype.createGraph = function() {
		this.r = this.ctx.canvas.width / 12;
		var r = this.r;
		var pos = [];
		var startX = 2 * r;
		var startY = 2 * r;
		var count = 1;
		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				pos.push({
					x: startX,
					y: startY,
					index: count
				})
				this.drawCircle(startX, startY, 'white');
				startX += 4 * r;
				count++;
			}
			startX = 2 * r;
			startY += 4 * r;
		}
		this.pos = pos;
	}

	//绑定touch事件
	Lock.prototype.addEvent = function() {
		var self = this;
		this.canvas.addEventListener('touchstart', function(e) {
			e.preventDefault();
			self.path = [];
			if (self.cachePath.length == 0) {
				self.showTip("请输入手势密码");
			}
			var touchPos = self.getPosition(e);
			for (var i = 0; i < 9; i++) {
				if (Math.abs(touchPos.x - self.pos[i].x) < self.r && Math.abs(touchPos.y - self.pos[i].y) < self.r) {
					self.path.push({
						x: self.pos[i].x,
						y: self.pos[i].y,
						index: self.pos[i].index
					});
					self.startDraw = true;
				}
			}
		}, false);

		this.canvas.addEventListener('touchmove', function(e) {
			if (self.startDraw) {
				var touchPos = self.getPosition(e);
				var pathLen = self.path.length;
				var lastPos;

				self.drawActive();
				self.drawLine(touchPos);

				for (var i = 0; i < self.pos.length; i++) {
					if (Math.abs(touchPos.x - self.pos[i].x) < self.r && Math.abs(touchPos.y - self.pos[i].y) < self.r) {
						lastPos = self.path[pathLen - 1];
						//保证在短暂频繁触发的move事件中不加入重复的当前点
						if (self.pos[i].index != lastPos.index) {
							self.path.push({
								x: self.pos[i].x,
								y: self.pos[i].y,
								index: self.pos[i].index
							});
						}

					}
				}
			}
		}, false);

		this.canvas.addEventListener('touchend', function(e) {
			var checkLock = document.getElementById("checkLock").checked;
			if (self.path.length < 5) {
				self.showTip("密码太短，至少需要5个点");
			} else {
				//验证密码模式
				if (checkLock) {
					self.checkLock();
				} else {
					//设置密码模式
					self.setLock();
				}


			}

		}, false);

		document.getElementById("checkLock").addEventListener('click',function(){
			self.showTip("验证密码");
		});
		document.getElementById("setLock").addEventListener('click',function(){
			self.clear();
			self.showTip("请输入手势密码");
		});
	};

	//画圆
	Lock.prototype.drawCircle = function(startX, startY, color) {

		var ctx = this.ctx;
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(startX, startY, this.r, 0, 2 * Math.PI, true);
		ctx.closePath();
		ctx.fill();
	};

	//每一次move都重新绘制；并将被选中的圆变成黄色
	Lock.prototype.drawActive = function() {
		this.clear();
		for (var i = 0; i < this.path.length; i++) {
			this.drawCircle(this.path[i].x, this.path[i].y, '#ffa726');
		}
	}

	//画线
	Lock.prototype.drawLine = function(touchPos) {

		this.ctx.strokeStyle = "red"
		this.ctx.beginPath();
		this.ctx.lineWidth = 1;
		this.ctx.moveTo(this.path[0].x, this.path[0].y);
		for (var i = 1; i < this.path.length; i++) {
			this.ctx.lineTo(this.path[i].x, this.path[i].y);
		}
		this.ctx.lineTo(touchPos.x, touchPos.y);
		this.ctx.stroke();
		this.ctx.closePath();
	}

	//获取手指在解锁区域内的位置
	Lock.prototype.getPosition = function(e) {
		var area = e.currentTarget.getBoundingClientRect();
		var touchPos = {
			x: e.touches[0].clientX - area.left,
			y: e.touches[0].clientY - area.top
		}
		return touchPos;
	};

	//设置密码
	Lock.prototype.setLock = function() {
		var path = this.path;
		var cachePath = this.cachePath;
		if (cachePath.length == 0) {
			this.cachePath = this.path;
			this.showTip("请再次输入手势密码");
			this.clear();
		} else {
			if (path.length !== cachePath.length) {
				this.showTip("两次输入的不一致,请重新设置");
				this.cachePath = [];
				return;
			}
			for (var i = 0; i < this.path.length; i++) {
				if (path[i].index !== cachePath[i].index) {
					this.showTip("两次输入的不一致,请重新设置");
					this.cachePath = [];
					return;
				}
			}
			this.showTip("密码设置成功");
			this.cachePath = [];
			this.clear();
			window.localStorage.setItem('path', JSON.stringify(this.path));
		}
	};

	//检查手势密码
	Lock.prototype.checkLock = function() {
		var path = this.path;
		var realPath = JSON.parse(window.localStorage.getItem('path'));
		for (var i = 0; i < path.length; i++) {
			if (path[i].index !== realPath[i].index) {
				this.showTip("输入的密码不正确");
				this.clear();
				return;
			}
		}
		this.showTip("密码正确！");

	}

	//显示提示语句
	Lock.prototype.showTip = function(content) {
		var tip = document.getElementById("tip");
		tip.innerText = content;
	}

	//清空解锁面板
	Lock.prototype.clear = function(){
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.createGraph();
	}
}());